-- Remove setup column, add playbookSetupId FK
ALTER TABLE "Trade" DROP COLUMN IF EXISTS "setup";
ALTER TABLE "Trade" ADD COLUMN IF NOT EXISTS "playbookSetupId" TEXT;
