-- CreateTable
CREATE TABLE "PlaybookTrigger" (
    "id" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaybookTrigger_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN "playbookTriggerId" TEXT;

-- AddForeignKey
ALTER TABLE "PlaybookTrigger" ADD CONSTRAINT "PlaybookTrigger_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_playbookTriggerId_fkey" FOREIGN KEY ("playbookTriggerId") REFERENCES "PlaybookTrigger"("id") ON DELETE SET NULL ON UPDATE CASCADE;
