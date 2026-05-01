import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Wallet } from 'xrpl';

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

    return {
      address: result.wallet.classicAddress,
      seed: result.wallet.seed,
      balance: result.balance,
    };
  }

  createWallet() {
    const wallet = Wallet.generate();

    return {
      address: wallet.classicAddress,
      seed: wallet.seed,
    };
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
