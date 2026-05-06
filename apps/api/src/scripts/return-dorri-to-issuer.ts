import { PlatformWalletKind, Prisma, PrismaClient } from '@prisma/client';
import { createDecipheriv, createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client, Wallet } from 'xrpl';

const prisma = new PrismaClient();

async function main() {
  loadLocalEnv();

  const email = process.argv[2];

  if (!email) {
    throw new Error('Usage: npm run dorri:return -- <user-email>');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      wallet: true,
      dorriAccount: true,
    },
  });
  const issuer = await prisma.platformWallet.findUnique({
    where: { kind: PlatformWalletKind.DORRI_ISSUER },
  });

  if (!user?.wallet) {
    throw new Error(`User wallet was not found: ${email}`);
  }

  if (!user.dorriAccount) {
    throw new Error(`DORRI account was not found: ${email}`);
  }

  if (!issuer) {
    throw new Error('DORRI issuer platform wallet was not found');
  }

  const client = new Client(process.env.XRPL_WSS_URL ?? 'wss://s.altnet.rippletest.net:51233');
  const currency = getDorriCurrencyCode();

  await client.connect();

  try {
    const balance = await getDorriBalance({
      client,
      account: user.wallet.xrplAddress,
      issuer: issuer.xrplAddress,
      currency,
    });

    if (new Prisma.Decimal(balance).lte(0)) {
      console.log(`${email}: DORRI balance is already ${balance}`);
      await updateSnapshot(user.id, balance);
      return;
    }

    const wallet = Wallet.fromSeed(decryptSeed(user.wallet.encryptedSeed));
    const response = await client.submitAndWait(
      {
        TransactionType: 'Payment',
        Account: user.wallet.xrplAddress,
        Destination: issuer.xrplAddress,
        Amount: {
          currency,
          issuer: issuer.xrplAddress,
          value: balance,
        },
      },
      {
        autofill: true,
        wallet,
      },
    );
    const result =
      typeof response.result.meta === 'object' ? response.result.meta.TransactionResult : undefined;

    if (result !== 'tesSUCCESS') {
      throw new Error(`DORRI return payment failed: ${result ?? 'UNKNOWN_RESULT'}`);
    }

    const updatedBalance = await getDorriBalance({
      client,
      account: user.wallet.xrplAddress,
      issuer: issuer.xrplAddress,
      currency,
    });

    await updateSnapshot(user.id, updatedBalance);

    console.log(
      JSON.stringify(
        {
          email,
          returnedDorri: balance,
          txHash: response.result.hash,
          remainingDorri: updatedBalance,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.disconnect();
  }
}

async function getDorriBalance(params: {
  client: Client;
  account: string;
  issuer: string;
  currency: string;
}) {
  const response = await params.client.request({
    command: 'account_lines',
    account: params.account,
    peer: params.issuer,
  });
  const line = response.result.lines.find(
    (trustLine) => trustLine.currency === params.currency && trustLine.account === params.issuer,
  );

  return line?.balance ?? '0';
}

async function updateSnapshot(userId: string, balance: string) {
  await prisma.dorriAccount.update({
    where: { userId },
    data: {
      balanceSnapshot: new Prisma.Decimal(balance),
      balanceCheckedAt: new Date(),
    },
  });
}

function decryptSeed(encryptedSeed: string) {
  const [iv, authTag, encrypted] = encryptedSeed.split('.');

  if (!iv || !authTag || !encrypted) {
    throw new Error('Wallet seed could not be decrypted');
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

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
