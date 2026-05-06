-- CreateEnum
CREATE TYPE "XrplNetwork" AS ENUM ('TESTNET', 'MAINNET');

-- CreateEnum
CREATE TYPE "TrustLineStatus" AS ENUM ('PENDING', 'ACTIVE', 'FAILED');

-- CreateEnum
CREATE TYPE "MeetupType" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "MeetupStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'SETTLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'REVIEWED', 'NO_SHOW', 'SETTLED', 'CANCELED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('CREATED', 'FINISHED', 'CANCELED', 'FAILED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SettlementReason" AS ENUM ('REJECTED', 'FREE_ATTENDED', 'FREE_NO_SHOW', 'PAID_ATTENDED', 'PAID_NO_SHOW');

-- CreateEnum
CREATE TYPE "SettlementLineType" AS ENUM ('PARTICIPANT_REFUND', 'HOST_PAYOUT', 'PLATFORM_FEE', 'NO_SHOW_PENALTY');

-- CreateEnum
CREATE TYPE "LedgerTxStatus" AS ENUM ('PENDING', 'VALIDATED', 'FAILED');

-- CreateEnum
CREATE TYPE "LedgerTxType" AS ENUM ('WALLET_FUND', 'TRUST_SET', 'DORRI_PAYMENT', 'ESCROW_CREATE', 'ESCROW_FINISH', 'ESCROW_CANCEL', 'SETTLEMENT_PAYMENT');

-- CreateEnum
CREATE TYPE "DorriChargeStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "profileImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xrplAddress" TEXT NOT NULL,
    "encryptedSeed" TEXT NOT NULL,
    "network" "XrplNetwork" NOT NULL DEFAULT 'TESTNET',
    "fundingTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DorriAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'DORRI',
    "issuerAddress" TEXT NOT NULL,
    "trustLineLimit" DECIMAL(18,6) NOT NULL,
    "trustLineStatus" "TrustLineStatus" NOT NULL DEFAULT 'PENDING',
    "trustLineTxHash" TEXT,
    "balanceSnapshot" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "balanceCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DorriAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meetup" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hostName" TEXT,
    "imageUrl" TEXT,
    "locationName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "mapImageUrl" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "type" "MeetupType" NOT NULL,
    "depositDorri" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "entryFeeDorri" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "capacity" INTEGER NOT NULL,
    "status" "MeetupStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meetup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetupTag" (
    "id" TEXT NOT NULL,
    "meetupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MeetupTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetupApplication" (
    "id" TEXT NOT NULL,
    "meetupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "lockedDorriAmount" DECIMAL(18,6) NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "noShowAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetupApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escrow" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "EscrowStatus" NOT NULL DEFAULT 'CREATED',
    "ownerAddress" TEXT NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "offerSequence" INTEGER NOT NULL,
    "lockedDorriAmount" DECIMAL(18,6) NOT NULL,
    "amountDrops" TEXT,
    "condition" TEXT,
    "fulfillmentEncrypted" TEXT,
    "createTxHash" TEXT NOT NULL,
    "finishTxHash" TEXT,
    "cancelTxHash" TEXT,
    "explorerUrl" TEXT,
    "finishAfter" TIMESTAMP(3),
    "cancelAfter" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Escrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "meetupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "tags" TEXT[],
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "meetupId" TEXT NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "reason" "SettlementReason" NOT NULL,
    "escrowFinishTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementLine" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "type" "SettlementLineType" NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "amountDorri" DECIMAL(18,6) NOT NULL,
    "txHash" TEXT,
    "status" "LedgerTxStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SettlementLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerTx" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "txHash" TEXT NOT NULL,
    "txType" "LedgerTxType" NOT NULL,
    "status" "LedgerTxStatus" NOT NULL DEFAULT 'PENDING',
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),

    CONSTRAINT "LedgerTx_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DorriCharge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "paymentTxHash" TEXT,
    "status" "DorriChargeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DorriCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "EmailVerificationCode_email_idx" ON "EmailVerificationCode"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_xrplAddress_key" ON "Wallet"("xrplAddress");

-- CreateIndex
CREATE UNIQUE INDEX "DorriAccount_userId_key" ON "DorriAccount"("userId");

-- CreateIndex
CREATE INDEX "Meetup_organizerId_idx" ON "Meetup"("organizerId");

-- CreateIndex
CREATE INDEX "Meetup_status_startsAt_idx" ON "Meetup"("status", "startsAt");

-- CreateIndex
CREATE INDEX "Meetup_type_idx" ON "Meetup"("type");

-- CreateIndex
CREATE INDEX "MeetupTag_meetupId_idx" ON "MeetupTag"("meetupId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetupTag_meetupId_name_key" ON "MeetupTag"("meetupId", "name");

-- CreateIndex
CREATE INDEX "MeetupApplication_userId_status_idx" ON "MeetupApplication"("userId", "status");

-- CreateIndex
CREATE INDEX "MeetupApplication_meetupId_status_idx" ON "MeetupApplication"("meetupId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MeetupApplication_meetupId_userId_key" ON "MeetupApplication"("meetupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_applicationId_key" ON "Escrow"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_createTxHash_key" ON "Escrow"("createTxHash");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_finishTxHash_key" ON "Escrow"("finishTxHash");

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_cancelTxHash_key" ON "Escrow"("cancelTxHash");

-- CreateIndex
CREATE INDEX "Escrow_ownerAddress_offerSequence_idx" ON "Escrow"("ownerAddress", "offerSequence");

-- CreateIndex
CREATE INDEX "Escrow_status_idx" ON "Escrow"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Review_applicationId_key" ON "Review"("applicationId");

-- CreateIndex
CREATE INDEX "Review_meetupId_idx" ON "Review"("meetupId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_applicationId_key" ON "Settlement"("applicationId");

-- CreateIndex
CREATE INDEX "Settlement_meetupId_idx" ON "Settlement"("meetupId");

-- CreateIndex
CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");

-- CreateIndex
CREATE INDEX "SettlementLine_settlementId_idx" ON "SettlementLine"("settlementId");

-- CreateIndex
CREATE INDEX "SettlementLine_txHash_idx" ON "SettlementLine"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerTx_txHash_key" ON "LedgerTx"("txHash");

-- CreateIndex
CREATE INDEX "LedgerTx_userId_idx" ON "LedgerTx"("userId");

-- CreateIndex
CREATE INDEX "LedgerTx_txType_status_idx" ON "LedgerTx"("txType", "status");

-- CreateIndex
CREATE INDEX "DorriCharge_userId_idx" ON "DorriCharge"("userId");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DorriAccount" ADD CONSTRAINT "DorriAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meetup" ADD CONSTRAINT "Meetup_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetupTag" ADD CONSTRAINT "MeetupTag_meetupId_fkey" FOREIGN KEY ("meetupId") REFERENCES "Meetup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetupApplication" ADD CONSTRAINT "MeetupApplication_meetupId_fkey" FOREIGN KEY ("meetupId") REFERENCES "Meetup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetupApplication" ADD CONSTRAINT "MeetupApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "MeetupApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "MeetupApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_meetupId_fkey" FOREIGN KEY ("meetupId") REFERENCES "Meetup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "MeetupApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_meetupId_fkey" FOREIGN KEY ("meetupId") REFERENCES "Meetup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementLine" ADD CONSTRAINT "SettlementLine_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerTx" ADD CONSTRAINT "LedgerTx_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DorriCharge" ADD CONSTRAINT "DorriCharge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
