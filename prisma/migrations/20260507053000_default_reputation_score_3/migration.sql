-- AlterTable
ALTER TABLE "User" ALTER COLUMN "reputationScore" SET DEFAULT 3;

-- Backfill existing MVP users that still have the previous initial score.
UPDATE "User"
SET "reputationScore" = 3
WHERE "reputationScore" = 0;
