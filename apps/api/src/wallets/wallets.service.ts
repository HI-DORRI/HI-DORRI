import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XrplNetwork } from '@prisma/client';
import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { XrplService } from '../xrpl/xrpl.service';

@Injectable()
export class WalletsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly xrplService: XrplService,
  ) {}

  async create(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'User was not found',
      });
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Email verification is required before wallet creation',
      });
    }

    if (user.wallet) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Wallet already exists',
      });
    }

    const fundedWallet = await this.createFundedWallet();
    const wallet = await this.prisma.wallet.create({
      data: {
        userId: user.id,
        xrplAddress: fundedWallet.address,
        encryptedSeed: this.encryptSeed(fundedWallet.seed),
        network: this.getNetwork(),
        fundingTxHash: fundedWallet.fundingTxHash,
      },
    });

    if (fundedWallet.fundingTxHash) {
      await this.prisma.ledgerTx.create({
        data: {
          userId: user.id,
          txHash: fundedWallet.fundingTxHash,
          txType: 'WALLET_FUND',
          status: 'VALIDATED',
          validatedAt: new Date(),
        },
      });
    }

    return {
      wallet: {
        id: wallet.id,
        xrplAddress: wallet.xrplAddress,
        network: wallet.network,
        createdAt: wallet.createdAt.toISOString(),
      },
      xrpl: {
        fundingTxHash: wallet.fundingTxHash,
        status: 'VALIDATED',
      },
      nextStep: 'CREATE_DORRI_TRUSTLINE',
    };
  }

  async getMyWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Wallet was not found',
      });
    }

    return {
      id: wallet.id,
      xrplAddress: wallet.xrplAddress,
      network: wallet.network,
      createdAt: wallet.createdAt.toISOString(),
    };
  }

  private async createFundedWallet() {
    try {
      return await this.xrplService.createFundedWallet();
    } catch (error) {
      throw new InternalServerErrorException({
        code: 'XRPL_TRANSACTION_FAILED',
        message: 'XRPL testnet wallet funding failed',
      });
    }
  }

  private encryptSeed(seed: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(seed, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [iv.toString('base64url'), authTag.toString('base64url'), encrypted.toString('base64url')].join('.');
  }

  private getEncryptionKey() {
    const secret = this.config.get<string>('WALLET_ENCRYPTION_KEY') ?? 'local-dev-wallet-encryption-key';

    return createHash('sha256').update(secret).digest();
  }

  private getNetwork() {
    return (this.config.get<string>('XRPL_NETWORK') as XrplNetwork | undefined) ?? XrplNetwork.TESTNET;
  }
}
