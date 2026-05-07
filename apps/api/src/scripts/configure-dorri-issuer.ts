import { PlatformWalletKind, PrismaClient } from '@prisma/client';
import { createDecipheriv, createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client, SubmittableTransaction, Wallet } from 'xrpl';

const prisma = new PrismaClient();

async function main() {
  loadLocalEnv();

  const issuer = await prisma.platformWallet.findUnique({
    where: { kind: PlatformWalletKind.DORRI_ISSUER },
  });

  if (!issuer?.encryptedSeed) {
    throw new Error('DORRI_ISSUER platform wallet seed is not initialized');
  }

  const client = new Client(process.env.XRPL_WSS_URL ?? 'wss://s.altnet.rippletest.net:51233');
  await client.connect();

  try {
    const wallet = Wallet.fromSeed(decryptSeed(issuer.encryptedSeed));

    await submitAndLog(client, wallet, {
      TransactionType: 'AccountSet',
      Account: issuer.xrplAddress,
      SetFlag: 8,
    }, 'issuer DefaultRipple');

    await submitAndLog(client, wallet, {
      TransactionType: 'AccountSet',
      Account: issuer.xrplAddress,
      SetFlag: 17,
    }, 'issuer AllowTrustLineLocking');

    const peers = await getTrustLinePeers();

    for (const peer of peers) {
      await submitAndLog(client, wallet, {
        TransactionType: 'TrustSet',
        Account: issuer.xrplAddress,
        LimitAmount: {
          currency: getDorriCurrencyCode(),
          issuer: peer,
          value: '0',
        },
        Flags: 262144,
      }, `clear NoRipple for ${peer}`);
    }
  } finally {
    await client.disconnect();
  }
}

async function getTrustLinePeers() {
  const [platformWallets, userWallets] = await Promise.all([
    prisma.platformWallet.findMany({
      where: {
        kind: {
          in: [PlatformWalletKind.SETTLEMENT, PlatformWalletKind.FEE],
        },
      },
      select: { xrplAddress: true },
    }),
    prisma.wallet.findMany({ select: { xrplAddress: true } }),
  ]);

  return [...new Set([...platformWallets, ...userWallets].map((wallet) => wallet.xrplAddress))];
}

async function submitAndLog(
  client: Client,
  wallet: Wallet,
  tx: SubmittableTransaction,
  label: string,
) {
  const response = await client.submitAndWait(tx, { autofill: true, wallet });
  const result =
    typeof response.result.meta === 'object'
      ? response.result.meta.TransactionResult
      : undefined;

  if (result !== 'tesSUCCESS') {
    throw new Error(`${label} failed: ${result ?? 'UNKNOWN_RESULT'}`);
  }

  console.log(`${label}: ${response.result.hash}`);
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

      process.env[envKey] ??= valueParts.join('=').trim().replace(/^"|"$/g, '');
    }
  }
}

function decryptSeed(encryptedSeed: string) {
  const [iv, authTag, encrypted] = encryptedSeed.split('.');

  if (!iv || !authTag || !encrypted) {
    throw new Error('Encrypted seed could not be decrypted');
  }

  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64url'));

  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString(
    'utf8',
  );
}

function getEncryptionKey() {
  const secret = process.env.WALLET_ENCRYPTION_KEY ?? 'local-dev-wallet-encryption-key';

  return createHash('sha256').update(secret).digest();
}

function getDorriCurrencyCode() {
  return process.env.DORRI_CURRENCY_CODE?.trim() ?? '444F525249000000000000000000000000000000';
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
