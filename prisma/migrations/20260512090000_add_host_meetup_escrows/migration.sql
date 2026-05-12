CREATE TABLE "HostMeetupEscrow" (
    "id" TEXT NOT NULL,
    "meetupId" TEXT NOT NULL,
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
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostMeetupEscrow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HostMeetupEscrow_meetupId_key" ON "HostMeetupEscrow"("meetupId");
CREATE UNIQUE INDEX "HostMeetupEscrow_createTxHash_key" ON "HostMeetupEscrow"("createTxHash");
CREATE UNIQUE INDEX "HostMeetupEscrow_finishTxHash_key" ON "HostMeetupEscrow"("finishTxHash");
CREATE UNIQUE INDEX "HostMeetupEscrow_cancelTxHash_key" ON "HostMeetupEscrow"("cancelTxHash");
CREATE INDEX "HostMeetupEscrow_ownerAddress_offerSequence_idx" ON "HostMeetupEscrow"("ownerAddress", "offerSequence");
CREATE INDEX "HostMeetupEscrow_status_idx" ON "HostMeetupEscrow"("status");

ALTER TABLE "HostMeetupEscrow" ADD CONSTRAINT "HostMeetupEscrow_meetupId_fkey" FOREIGN KEY ("meetupId") REFERENCES "Meetup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
