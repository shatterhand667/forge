-- CreateTable
CREATE TABLE "Playbook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tierADescription" TEXT,
    "tierACriteria" JSONB,
    "tierAMarketContext" TEXT,
    "tierAInvalidation" TEXT,
    "tierANotes" TEXT,
    "tierBDescription" TEXT,
    "tierBCriteria" JSONB,
    "tierBMarketContext" TEXT,
    "tierBInvalidation" TEXT,
    "tierBNotes" TEXT,
    "tierCDescription" TEXT,
    "tierCCriteria" JSONB,
    "tierCMarketContext" TEXT,
    "tierCInvalidation" TEXT,
    "tierCNotes" TEXT,
    "maxDailyLoss" DOUBLE PRECISION,
    "maxWeeklyLoss" DOUBLE PRECISION,
    "maxRiskPerTrade" DOUBLE PRECISION,
    "maxOpenPositions" INTEGER,
    "hardRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaybookSetup" (
    "id" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "tier" TEXT,
    "description" TEXT,
    "criteria" JSONB,
    "invalidation" TEXT,
    "bestContext" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaybookSetup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Playbook_userId_key" ON "Playbook"("userId");

-- AddForeignKey
ALTER TABLE "Playbook" ADD CONSTRAINT "Playbook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybookSetup" ADD CONSTRAINT "PlaybookSetup_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
