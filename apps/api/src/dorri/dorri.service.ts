import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlatformWalletKind, Prisma } from '@prisma/client';
import { createDecipheriv, createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { XrplService } from '../xrpl/xrpl.service';
import { ChargeDorriDto } from './dto/charge-dorri.dto';
import { CreateChargeQuoteDto } from './dto/create-charge-quote.dto';
import { CreateTrustLineDto } from './dto/create-trustline.dto';

@Injectable()
export class DorriService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly xrplService: XrplService,
  ) {}

  async createTrustLine(userId: string, dto: CreateTrustLineDto) {
    const wallet = await this.getWallet(userId);
    const issuerAddress = await this.getIssuerAddress();
    const limit = dto.limit ?? '100000';
    const existingAccount = await this.prisma.dorriAccount.findUnique({
      where: { userId },
    });

    if (existingAccount?.trustLineStatus === 'ACTIVE') {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'DORRI TrustLine already exists',
      });
    }

    const tx = await this.submitTrustLine({
      seed: this.decryptSeed(wallet.encryptedSeed),
      account: wallet.xrplAddress,
      issuer: issuerAddress,
      limit,
    });
    const balance = await this.getLedgerBalance(wallet.xrplAddress, issuerAddress);
    const trustLine = await this.prisma.dorriAccount.upsert({
      where: { userId },
      create: {
        userId,
        issuerAddress,
        trustLineLimit: new Prisma.Decimal(limit),
        trustLineStatus: 'ACTIVE',
        trustLineTxHash: tx.txHash,
        balanceSnapshot: new Prisma.Decimal(balance),
        balanceCheckedAt: new Date(),
      },
      update: {
        issuerAddress,
        trustLineLimit: new Prisma.Decimal(limit),
        trustLineStatus: 'ACTIVE',
        trustLineTxHash: tx.txHash,
        balanceSnapshot: new Prisma.Decimal(balance),
        balanceCheckedAt: new Date(),
      },
    });

    await this.prisma.ledgerTx.create({
      data: {
        userId,
        txHash: tx.txHash,
        txType: 'TRUST_SET',
        status: 'VALIDATED',
        rawJson: tx.rawJson as Prisma.InputJsonValue,
        validatedAt: new Date(),
      },
    });

    return {
      trustLine: {
        status: trustLine.trustLineStatus,
        currency: trustLine.currency,
        issuer: trustLine.issuerAddress,
        limit: this.formatDecimal(trustLine.trustLineLimit),
      },
      tx: {
        txHash: tx.txHash,
        status: 'VALIDATED',
        explorerUrl: this.createExplorerUrl(tx.txHash),
      },
      nextStep: 'HOME',
    };
  }

  async getBalance(userId: string) {
    const wallet = await this.getWallet(userId);
    const issuerAddress = await this.getIssuerAddress();
    const dorriAccount = await this.prisma.dorriAccount.findUnique({
      where: { userId },
    });

    if (!dorriAccount) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'DORRI TrustLine was not found',
      });
    }

    const balance = await this.getLedgerBalance(wallet.xrplAddress, issuerAddress);
    const updated = await this.prisma.dorriAccount.update({
      where: { userId },
      data: {
        balanceSnapshot: new Prisma.Decimal(balance),
        balanceCheckedAt: new Date(),
      },
    });

    return {
      currency: updated.currency,
      balance: this.formatDecimal(updated.balanceSnapshot),
      trustLineStatus: updated.trustLineStatus,
      issuer: updated.issuerAddress,
      updatedAt: updated.balanceCheckedAt?.toISOString() ?? updated.updatedAt.toISOString(),
    };
  }

  async getRates() {
    const currencies = ['USD', 'KRW', 'JPY'];
    const rates = await Promise.all(
      currencies.map(async (currency) => ({
        currency,
        fiatPerDorri: this.formatDecimal(await this.getFiatPerUsdRate(currency)),
      })),
    );

    return {
      base: 'DORRI',
      usdPerDorri: '1',
      rates,
      updatedAt: new Date().toISOString(),
    };
  }

  async createChargeQuote(userId: string, dto: CreateChargeQuoteDto) {
    const fiatCurrency = dto.fiatCurrency.toUpperCase();
    const fiatAmount = new Prisma.Decimal(dto.fiatAmount);

    if (fiatAmount.lte(0)) {
      throw new BadRequestException({
        code: 'INVALID_REQUEST',
        message: 'Fiat amount must be greater than 0',
      });
    }

    const rateToUsd = await this.getFiatPerUsdRate(fiatCurrency);
    const dorriAmount = fiatAmount.div(rateToUsd).toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);
    const expiresAt = new Date(Date.now() + this.getQuoteTtlSeconds() * 1000);
    const quote = await this.prisma.dorriChargeQuote.create({
      data: {
        userId,
        fiatCurrency,
        fiatAmount,
        rateToUsd,
        dorriAmount,
        expiresAt,
      },
    });

    return {
      quoteId: quote.id,
      fiat: {
        currency: quote.fiatCurrency,
        amount: this.formatDecimal(quote.fiatAmount),
        rateToUsd: this.formatDecimal(quote.rateToUsd),
      },
      dorri: {
        currency: 'DORRI',
        amount: this.formatDorriAmount(quote.dorriAmount),
      },
      expiresAt: quote.expiresAt.toISOString(),
    };
  }

  async charge(userId: string, dto: ChargeDorriDto) {
    const quote = await this.prisma.dorriChargeQuote.findUnique({
      where: { id: dto.quoteId },
    });

    if (!quote) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'DORRI charge quote was not found',
      });
    }

    if (quote.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'DORRI charge quote belongs to another user',
      });
    }

    if (quote.consumedAt) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'DORRI charge quote was already used',
      });
    }

    if (quote.expiresAt <= new Date()) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'DORRI charge quote is expired',
      });
    }

    const wallet = await this.getWallet(userId);
    const dorriAccount = await this.getDorriAccount(userId);
    const issuerWallet = await this.getIssuerWallet();
    const tx = await this.submitDorriPayment({
      seed: this.decryptSeed(issuerWallet.encryptedSeed),
      account: issuerWallet.xrplAddress,
      issuer: issuerWallet.xrplAddress,
      destination: wallet.xrplAddress,
      amount: this.formatDecimal(quote.dorriAmount),
    });
    const balance = await this.getLedgerBalance(wallet.xrplAddress, dorriAccount.issuerAddress);
    const [charge] = await this.prisma.$transaction([
      this.prisma.dorriCharge.create({
        data: {
          userId,
          quoteId: quote.id,
          amount: quote.dorriAmount,
          fiatCurrency: quote.fiatCurrency,
          fiatAmount: quote.fiatAmount,
          rateToUsd: quote.rateToUsd,
          dorriAmount: quote.dorriAmount,
          paymentTxHash: tx.txHash,
          status: 'COMPLETED',
        },
      }),
      this.prisma.dorriChargeQuote.update({
        where: { id: quote.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.ledgerTx.create({
        data: {
          userId,
          txHash: tx.txHash,
          txType: 'DORRI_PAYMENT',
          status: 'VALIDATED',
          rawJson: tx.rawJson as Prisma.InputJsonValue,
          validatedAt: new Date(),
        },
      }),
      this.prisma.dorriAccount.update({
        where: { userId },
        data: {
          balanceSnapshot: new Prisma.Decimal(balance),
          balanceCheckedAt: new Date(),
        },
      }),
    ]);

    return {
      charge: {
        id: charge.id,
        fiatCurrency: charge.fiatCurrency,
        fiatAmount: charge.fiatAmount ? this.formatDecimal(charge.fiatAmount) : null,
        rateToUsd: charge.rateToUsd ? this.formatDecimal(charge.rateToUsd) : null,
        amount: this.formatDorriAmount(charge.amount),
        status: charge.status,
      },
      balance: {
        currency: 'DORRI',
        balance,
      },
      tx: {
        txHash: tx.txHash,
        status: 'VALIDATED',
        explorerUrl: this.createExplorerUrl(tx.txHash),
      },
    };
  }

  private async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Wallet was not found',
      });
    }

    return wallet;
  }

  private async getDorriAccount(userId: string) {
    const dorriAccount = await this.prisma.dorriAccount.findUnique({
      where: { userId },
    });

    if (!dorriAccount || dorriAccount.trustLineStatus !== 'ACTIVE') {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'DORRI TrustLine was not found',
      });
    }

    return dorriAccount;
  }

  private async submitTrustLine(params: { seed: string; account: string; issuer: string; limit: string }) {
    try {
      return await this.xrplService.createDorriTrustLine(params);
    } catch (error) {
      throw new InternalServerErrorException({
        code: 'XRPL_TRANSACTION_FAILED',
        message: 'DORRI TrustLine transaction failed',
      });
    }
  }

  private async getLedgerBalance(account: string, issuer: string) {
    try {
      return await this.xrplService.getDorriBalance({ account, issuer });
    } catch (error) {
      throw new InternalServerErrorException({
        code: 'XRPL_TRANSACTION_FAILED',
        message: 'DORRI balance lookup failed',
      });
    }
  }

  private decryptSeed(encryptedSeed: string) {
    const [iv, authTag, encrypted] = encryptedSeed.split('.');

    if (!iv || !authTag || !encrypted) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Wallet seed could not be decrypted',
      });
    }

    const decipher = createDecipheriv('aes-256-gcm', this.getEncryptionKey(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(authTag, 'base64url'));

    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  private getEncryptionKey() {
    const secret = this.config.get<string>('WALLET_ENCRYPTION_KEY') ?? 'local-dev-wallet-encryption-key';

    return createHash('sha256').update(secret).digest();
  }

  private async getIssuerAddress() {
    const issuerWallet = await this.getIssuerWallet();

    return issuerWallet.xrplAddress;
  }

  private async getIssuerWallet() {
    const issuerWallet = await this.prisma.platformWallet.findUnique({
      where: { kind: PlatformWalletKind.DORRI_ISSUER },
    });

    if (!issuerWallet) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'DORRI issuer platform wallet is not initialized',
      });
    }

    if (!issuerWallet.encryptedSeed) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'DORRI issuer seed is not available for MVP charge',
      });
    }

    return {
      ...issuerWallet,
      encryptedSeed: issuerWallet.encryptedSeed,
    };
  }

  private async submitDorriPayment(params: {
    seed: string;
    account: string;
    issuer: string;
    destination: string;
    amount: string;
  }) {
    try {
      return await this.xrplService.sendDorriPayment(params);
    } catch (error) {
      throw new InternalServerErrorException({
        code: 'XRPL_TRANSACTION_FAILED',
        message: 'DORRI payment transaction failed',
      });
    }
  }

  private async getFiatPerUsdRate(fiatCurrency: string) {
    if (fiatCurrency === 'USD') {
      return new Prisma.Decimal(1);
    }

    const baseUrl = this.config.get<string>('EXCHANGE_RATE_API_BASE_URL') ?? 'https://fxapi.app/api';
    const url = `${baseUrl}/USD/${fiatCurrency}.json`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Exchange rate API responded ${response.status}`);
      }

      const body = (await response.json()) as { rate?: number };

      if (typeof body.rate !== 'number' || !Number.isFinite(body.rate) || body.rate <= 0) {
        throw new Error('Exchange rate API returned invalid rate');
      }

      return new Prisma.Decimal(body.rate);
    } catch (error) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Exchange rate lookup failed',
      });
    }
  }

  private getQuoteTtlSeconds() {
    return this.config.get<number>('DORRI_CHARGE_QUOTE_TTL_SECONDS') ?? 300;
  }

  private createExplorerUrl(txHash: string) {
    return `https://testnet.xrpl.org/transactions/${txHash}`;
  }

  private formatDecimal(value: Prisma.Decimal) {
    return value.toString();
  }

  private formatDorriAmount(value: Prisma.Decimal) {
    return value.toFixed(2);
  }
}
