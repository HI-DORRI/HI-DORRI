import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { Client, Wallet } from 'xrpl';
import {
  buildDorriPayment,
  buildDorriEscrowCreate,
  buildDorriTrustSet,
  buildXrpEscrowCreate,
  buildXrpEscrowFinish,
} from './transactions';

@Injectable()
export class XrplService implements OnModuleDestroy {
  private client?: Client;

  constructor(private readonly config: ConfigService) {}

  async getClient() {
    if (!this.client) {
      this.client = new Client(
        this.config.get<string>('XRPL_WSS_URL') ?? 'wss://s.altnet.rippletest.net:51233',
      );
    }

    if (!this.client.isConnected()) {
      await this.client.connect();
    }

    return this.client;
  }

  async createFundedWallet() {
    const client = await this.getClient();
    const result = await client.fundWallet();

    if (!result.wallet.seed) {
      throw new Error('Funded XRPL wallet seed was not returned');
    }

    return {
      address: result.wallet.classicAddress,
      seed: result.wallet.seed,
      balance: result.balance,
      fundingTxHash: null,
    };
  }

  createWallet() {
    const wallet = Wallet.generate();

    return {
      address: wallet.classicAddress,
      seed: wallet.seed,
    };
  }

  async createDorriTrustLine(params: {
    seed: string;
    account: string;
    issuer: string;
    limit: string;
  }): Promise<{ txHash: string; rawJson: unknown }> {
    const client = await this.getClient();
    const wallet = Wallet.fromSeed(params.seed);
    const tx = buildDorriTrustSet({
      account: params.account,
      issuer: params.issuer,
      limit: params.limit,
      currency: this.getDorriCurrencyCode(),
    });
    const response = await client.submitAndWait(tx, {
      autofill: true,
      wallet,
    });
    const result =
      typeof response.result.meta === 'object' ? response.result.meta.TransactionResult : undefined;

    if (result !== 'tesSUCCESS') {
      throw new Error(`XRPL TrustSet failed: ${result ?? 'UNKNOWN_RESULT'}`);
    }

    return {
      txHash: response.result.hash,
      rawJson: JSON.parse(JSON.stringify(response.result)),
    };
  }

  async getDorriBalance(params: { account: string; issuer: string }) {
    const client = await this.getClient();
    const response = await client.request({
      command: 'account_lines',
      account: params.account,
      peer: params.issuer,
    });
    const currency = this.getDorriCurrencyCode();
    const line = response.result.lines.find(
      (trustLine) => trustLine.currency === currency && trustLine.account === params.issuer,
    );

    if (!line) {
      return '0';
    }

    const balance = new Prisma.Decimal(line.balance ?? '0');
    const lockedBalance = new Prisma.Decimal(
      this.getAmountValue(
        (line as { locked_balance?: unknown; LockedBalance?: unknown }).locked_balance ??
          (line as { locked_balance?: unknown; LockedBalance?: unknown }).LockedBalance,
      ),
    );
    const spendableBalance = balance.minus(lockedBalance);

    return spendableBalance.isNegative() ? '0' : spendableBalance.toString();
  }

  private getAmountValue(amount: unknown) {
    if (typeof amount === 'string') {
      return amount;
    }

    if (typeof amount === 'object' && amount !== null && 'value' in amount) {
      const value = (amount as { value?: unknown }).value;
      return typeof value === 'string' ? value : '0';
    }

    return '0';
  }

  async sendDorriPayment(params: {
    seed: string;
    account: string;
    issuer: string;
    destination: string;
    amount: string;
  }): Promise<{ txHash: string; rawJson: unknown }> {
    const client = await this.getClient();
    const wallet = Wallet.fromSeed(params.seed);
    const tx = buildDorriPayment({
      account: params.account,
      issuer: params.issuer,
      destination: params.destination,
      amount: params.amount,
      currency: this.getDorriCurrencyCode(),
    });
    const response = await client.submitAndWait(tx, {
      autofill: true,
      wallet,
    });
    const result =
      typeof response.result.meta === 'object' ? response.result.meta.TransactionResult : undefined;

    if (result !== 'tesSUCCESS') {
      throw new Error(`XRPL DORRI Payment failed: ${result ?? 'UNKNOWN_RESULT'}`);
    }

    return {
      txHash: response.result.hash,
      rawJson: JSON.parse(JSON.stringify(response.result)),
    };
  }

  async createXrpEscrow(params: {
    seed: string;
    account: string;
    destination: string;
    amountXrp: string;
    finishAfterRippleTime?: number;
    cancelAfterRippleTime?: number;
  }): Promise<{ txHash: string; offerSequence: number; amountDrops: string; rawJson: unknown }> {
    const client = await this.getClient();
    const wallet = Wallet.fromSeed(params.seed);
    const tx = buildXrpEscrowCreate({
      account: params.account,
      destination: params.destination,
      amountXrp: params.amountXrp,
      finishAfterRippleTime: params.finishAfterRippleTime,
      cancelAfterRippleTime: params.cancelAfterRippleTime,
    });
    const response = await client.submitAndWait(tx, {
      autofill: true,
      wallet,
    });
    const result =
      typeof response.result.meta === 'object' ? response.result.meta.TransactionResult : undefined;

    if (result !== 'tesSUCCESS') {
      throw new Error(`XRPL EscrowCreate failed: ${result ?? 'UNKNOWN_RESULT'}`);
    }

    const rawJson = JSON.parse(JSON.stringify(response.result));
    const offerSequence = Number(rawJson.tx_json?.Sequence ?? rawJson.Sequence);

    if (!Number.isInteger(offerSequence)) {
      throw new Error('XRPL EscrowCreate sequence was not returned');
    }

    return {
      txHash: response.result.hash,
      offerSequence,
      amountDrops: String(tx.Amount),
      rawJson,
    };
  }

  async createDorriEscrow(params: {
    seed: string;
    account: string;
    destination: string;
    amount: string;
    issuer: string;
    finishAfterRippleTime?: number;
    cancelAfterRippleTime: number;
  }): Promise<{ txHash: string; offerSequence: number; rawJson: unknown }> {
    const client = await this.getClient();
    const wallet = Wallet.fromSeed(params.seed);
    const tx = buildDorriEscrowCreate({
      account: params.account,
      destination: params.destination,
      amount: params.amount,
      issuer: params.issuer,
      currency: this.getDorriCurrencyCode(),
      finishAfterRippleTime: params.finishAfterRippleTime,
      cancelAfterRippleTime: params.cancelAfterRippleTime,
    });
    const response = await client.submitAndWait(tx, {
      autofill: true,
      wallet,
    });
    const result =
      typeof response.result.meta === 'object' ? response.result.meta.TransactionResult : undefined;

    if (result !== 'tesSUCCESS') {
      throw new Error(`XRPL DORRI EscrowCreate failed: ${result ?? 'UNKNOWN_RESULT'}`);
    }

    const rawJson = JSON.parse(JSON.stringify(response.result));
    const offerSequence = Number(rawJson.tx_json?.Sequence ?? rawJson.Sequence);

    if (!Number.isInteger(offerSequence)) {
      throw new Error('XRPL DORRI EscrowCreate sequence was not returned');
    }

    return {
      txHash: response.result.hash,
      offerSequence,
      rawJson,
    };
  }

  async finishXrpEscrow(params: {
    seed: string;
    account: string;
    owner: string;
    offerSequence: number;
    condition?: string;
    fulfillment?: string;
  }): Promise<{ txHash: string; rawJson: unknown }> {
    const client = await this.getClient();
    const wallet = Wallet.fromSeed(params.seed);
    const tx = buildXrpEscrowFinish({
      account: params.account,
      owner: params.owner,
      offerSequence: params.offerSequence,
      condition: params.condition,
      fulfillment: params.fulfillment,
    });
    const response = await client.submitAndWait(tx, {
      autofill: true,
      wallet,
    });
    const result =
      typeof response.result.meta === 'object' ? response.result.meta.TransactionResult : undefined;

    if (result !== 'tesSUCCESS') {
      throw new Error(`XRPL EscrowFinish failed: ${result ?? 'UNKNOWN_RESULT'}`);
    }

    return {
      txHash: response.result.hash,
      rawJson: JSON.parse(JSON.stringify(response.result)),
    };
  }

  getDorriCurrencyCode() {
    return (
      this.config.get<string>('DORRI_CURRENCY_CODE')?.trim() ??
      '444F525249000000000000000000000000000000'
    );
  }

  async getServerInfo() {
    const client = await this.getClient();
    const response = await client.request({ command: 'server_info' });

    return response.result;
  }

  async onModuleDestroy() {
    if (this.client?.isConnected()) {
      await this.client.disconnect();
    }
  }
}
