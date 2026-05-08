-- AlterTable
ALTER TABLE "DorriCharge"
ADD COLUMN "quoteId" TEXT,
ADD COLUMN "fiatCurrency" TEXT,
ADD COLUMN "fiatAmount" DECIMAL(18,6),
ADD COLUMN "rateToUsd" DECIMAL(18,6),
ADD COLUMN "dorriAmount" DECIMAL(18,6);

-- CreateTable
CREATE TABLE "DorriChargeQuote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fiatCurrency" TEXT NOT NULL,
    "fiatAmount" DECIMAL(18,6) NOT NULL,
    "rateToUsd" DECIMAL(18,6) NOT NULL,
    "dorriAmount" DECIMAL(18,6) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DorriChargeQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DorriCharge_quoteId_key" ON "DorriCharge"("quoteId");

-- CreateIndex
CREATE INDEX "DorriChargeQuote_userId_idx" ON "DorriChargeQuote"("userId");

-- CreateIndex
CREATE INDEX "DorriChargeQuote_expiresAt_idx" ON "DorriChargeQuote"("expiresAt");

-- AddForeignKey
ALTER TABLE "DorriCharge" ADD CONSTRAINT "DorriCharge_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "DorriChargeQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DorriChargeQuote" ADD CONSTRAINT "DorriChargeQuote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
