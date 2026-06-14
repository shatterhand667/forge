CREATE TABLE "DayTag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DayTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyCardDayTag" (
    "dailyCardId" TEXT NOT NULL,
    "dayTagId" TEXT NOT NULL,
    CONSTRAINT "DailyCardDayTag_pkey" PRIMARY KEY ("dailyCardId","dayTagId")
);

CREATE UNIQUE INDEX "DayTag_userId_name_key" ON "DayTag"("userId", "name");

ALTER TABLE "DayTag" ADD CONSTRAINT "DayTag_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailyCardDayTag" ADD CONSTRAINT "DailyCardDayTag_dailyCardId_fkey"
    FOREIGN KEY ("dailyCardId") REFERENCES "DailyCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailyCardDayTag" ADD CONSTRAINT "DailyCardDayTag_dayTagId_fkey"
    FOREIGN KEY ("dayTagId") REFERENCES "DayTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
