-- AlterTable
ALTER TABLE "DailyCard" ADD COLUMN     "screenshotPath" TEXT;

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "instrument" TEXT,
ADD COLUMN     "profitRaw" DOUBLE PRECISION;
