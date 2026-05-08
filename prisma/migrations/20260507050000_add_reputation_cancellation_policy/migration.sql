-- AlterEnum
ALTER TYPE "SettlementReason" ADD VALUE 'FREE_CANCELED_48H_PLUS';
ALTER TYPE "SettlementReason" ADD VALUE 'FREE_CANCELED_24_48';
ALTER TYPE "SettlementReason" ADD VALUE 'FREE_CANCELED_WITHIN_24';
ALTER TYPE "SettlementReason" ADD VALUE 'PAID_CANCELED_48H_PLUS';
ALTER TYPE "SettlementReason" ADD VALUE 'PAID_CANCELED_24_48';
ALTER TYPE "SettlementReason" ADD VALUE 'PAID_CANCELED_WITHIN_24';

-- CreateEnum
CREATE TYPE "ReputationEventType" AS ENUM ('ATTENDANCE', 'CANCEL_48H_PLUS', 'CANCEL_24_48', 'CANCEL_WITHIN_24', 'NO_SHOW');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "reputationScore" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserReputationEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "ReputationEventType" NOT NULL,
    "delta" DECIMAL(5,2) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReputationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizerParticipantEvaluation" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "tags" TEXT[],
    "comment" TEXT,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizerParticipantEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,
    "applicationId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserReputationEvent_applicationId_key" ON "UserReputationEvent"("applicationId");

-- CreateIndex
CREATE INDEX "UserReputationEvent_userId_idx" ON "UserReputationEvent"("userId");

-- CreateIndex
CREATE INDEX "UserReputationEvent_type_idx" ON "UserReputationEvent"("type");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerParticipantEvaluation_applicationId_key" ON "OrganizerParticipantEvaluation"("applicationId");

-- CreateIndex
CREATE INDEX "OrganizerParticipantEvaluation_organizerId_idx" ON "OrganizerParticipantEvaluation"("organizerId");

-- CreateIndex
CREATE INDEX "OrganizerParticipantEvaluation_participantId_idx" ON "OrganizerParticipantEvaluation"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedUserId_key" ON "UserBlock"("blockerId", "blockedUserId");

-- CreateIndex
CREATE INDEX "UserBlock_blockedUserId_idx" ON "UserBlock"("blockedUserId");

-- CreateIndex
CREATE INDEX "UserBlock_applicationId_idx" ON "UserBlock"("applicationId");

-- AddForeignKey
ALTER TABLE "UserReputationEvent" ADD CONSTRAINT "UserReputationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReputationEvent" ADD CONSTRAINT "UserReputationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "MeetupApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerParticipantEvaluation" ADD CONSTRAINT "OrganizerParticipantEvaluation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "MeetupApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerParticipantEvaluation" ADD CONSTRAINT "OrganizerParticipantEvaluation_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerParticipantEvaluation" ADD CONSTRAINT "OrganizerParticipantEvaluation_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "MeetupApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
