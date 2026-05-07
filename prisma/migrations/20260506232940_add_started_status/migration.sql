-- AlterEnum
ALTER TYPE "CardStatus" ADD VALUE 'STARTED';

-- AlterTable
ALTER TABLE "DailyCard" ALTER COLUMN "status" SET DEFAULT 'STARTED';
