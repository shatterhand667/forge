-- Drop old single screenshot column (data loss accepted — column added this session only)
ALTER TABLE "DailyCard" DROP COLUMN IF EXISTS "screenshotPath";

-- Create DailyCardScreenshot table
CREATE TABLE "DailyCardScreenshot" (
    "id" TEXT NOT NULL,
    "dailyCardId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyCardScreenshot_pkey" PRIMARY KEY ("id")
);

-- Foreign key with cascade delete
ALTER TABLE "DailyCardScreenshot" ADD CONSTRAINT "DailyCardScreenshot_dailyCardId_fkey"
    FOREIGN KEY ("dailyCardId") REFERENCES "DailyCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
