import { PlatformWalletKind, PrismaClient, XrplNetwork } from '@prisma/client';
import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'xrpl';

type WalletRecord = {
  kind: PlatformWalletKind;
  xrplAddress: string;
  encryptedSeed: string;
  fundingTxHash: string | null;
};

const prisma = new PrismaClient();

async function main() {
  loadLocalEnv();

  const client = new Client(process.env.XRPL_WSS_URL ?? 'wss://s.altnet.rippletest.net:51233');

  await client.connect();

  try {
    const wallets: WalletRecord[] = [];

    for (const kind of [
      PlatformWalletKind.DORRI_ISSUER,
      PlatformWalletKind.SETTLEMENT,
      PlatformWalletKind.FEE,
    ]) {
      const existing = await prisma.platformWallet.findUnique({
        where: { kind },
      });

      if (existing) {
        console.log(`${kind}: already exists (${existing.xrplAddress})`);
        continue;
      }

      const funded = await client.fundWallet();
      const seed = funded.wallet.seed;

      if (!seed) {
        throw new Error(`${kind}: XRPL faucet did not return a seed`);
      }

      const wallet = await prisma.platformWallet.create({
        data: {
          kind,
          xrplAddress: funded.wallet.classicAddress,
          encryptedSeed: encryptSeed(seed),
          network: getNetwork(),
          fundingTxHash: null,
        },
      });

      wallets.push({
        kind,
        xrplAddress: wallet.xrplAddress,
        encryptedSeed: wallet.encryptedSeed ?? '',
        fundingTxHash: wallet.fundingTxHash,
      });

      console.log(`${kind}: created (${wallet.xrplAddress})`);
    }

    console.log('');
    console.log('Platform wallet addresses:');

    const allWallets = await prisma.platformWallet.findMany({
      orderBy: { kind: 'asc' },
    });

    for (const wallet of allWallets) {
      console.log(`${wallet.kind}=${wallet.xrplAddress}`);
    }
  } finally {
    await client.disconnect();
  }
}

function loadLocalEnv() {
  for (const envPath of [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')]) {
    if (!existsSync(envPath)) {
      continue;
    }

    const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split('=');
      const envKey = key?.trim();

      if (!envKey) {
        continue;
      }

      const value = valueParts.join('=').trim().replace(/^"|"$/g, '');

      process.env[envKey] ??= value;
    }
  }
}

function encryptSeed(seed: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(seed, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('base64url'), authTag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

function getEncryptionKey() {
  const secret = process.env.WALLET_ENCRYPTION_KEY ?? 'local-dev-wallet-encryption-key';

  return createHash('sha256').update(secret).digest();
}

function getNetwork() {
  return (process.env.XRPL_NETWORK as XrplNetwork | undefined) ?? XrplNetwork.TESTNET;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
