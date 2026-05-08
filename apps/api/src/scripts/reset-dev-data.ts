import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const prisma = new PrismaClient();

async function main() {
  loadLocalEnv();

  if (process.env.NODE_ENV === 'production') {
    throw new Error('reset:dev-data cannot run in production');
  }

  await prisma.$transaction([
    prisma.userBlock.deleteMany(),
    prisma.organizerParticipantEvaluation.deleteMany(),
    prisma.userReputationEvent.deleteMany(),
    prisma.settlementLine.deleteMany(),
    prisma.settlement.deleteMany(),
    prisma.review.deleteMany(),
    prisma.escrow.deleteMany(),
    prisma.meetupApplication.deleteMany(),
    prisma.meetupTag.deleteMany(),
    prisma.meetup.deleteMany(),
    prisma.dorriCharge.deleteMany(),
    prisma.dorriChargeQuote.deleteMany(),
    prisma.dorriAccount.deleteMany(),
    prisma.wallet.deleteMany(),
    prisma.emailVerificationCode.deleteMany(),
    prisma.ledgerTx.deleteMany({
      where: {
        userId: {
          not: null,
        },
      },
    }),
    prisma.user.deleteMany(),
  ]);

  const platformWallets = await prisma.platformWallet.findMany({
    orderBy: { kind: 'asc' },
    select: {
      kind: true,
      xrplAddress: true,
      network: true,
    },
  });

  console.log('Development data was reset.');
  console.log('Platform wallets were preserved:');

  for (const wallet of platformWallets) {
    console.log(`${wallet.kind}: ${wallet.xrplAddress} (${wallet.network})`);
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

      process.env[envKey] ??= valueParts.join('=').trim().replace(/^"|"$/g, '');
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
