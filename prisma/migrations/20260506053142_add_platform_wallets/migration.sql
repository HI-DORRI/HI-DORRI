-- CreateEnum
CREATE TYPE "PlatformWalletKind" AS ENUM ('DORRI_ISSUER', 'SETTLEMENT', 'FEE');

-- CreateTable
CREATE TABLE "PlatformWallet" (
    "id" TEXT NOT NULL,
    "kind" "PlatformWalletKind" NOT NULL,
    "xrplAddress" TEXT NOT NULL,
    "encryptedSeed" TEXT,
    "network" "XrplNetwork" NOT NULL DEFAULT 'TESTNET',
    "fundingTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformWallet_kind_key" ON "PlatformWallet"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformWallet_xrplAddress_key" ON "PlatformWallet"("xrplAddress");

-- CreateIndex
CREATE INDEX "PlatformWallet_network_idx" ON "PlatformWallet"("network");
