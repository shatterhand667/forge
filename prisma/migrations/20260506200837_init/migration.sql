-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('MORNING', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "CardStatus" NOT NULL DEFAULT 'MORNING',
    "sleep" INTEGER,
    "energy" INTEGER,
    "focus" INTEGER,
    "prepQuality" INTEGER,
    "moodNotes" TEXT,
    "trendBias" TEXT,
    "keyLevels" TEXT,
    "macroNews" TEXT,
    "correlations" TEXT,
    "whatIfs" TEXT,
    "entryConditions" TEXT,
    "tierASetup" TEXT,
    "tierBSetup" TEXT,
    "tierCSetup" TEXT,
    "preMortem" TEXT,
    "dailyGoal" TEXT,
    "yesterdayLesson" TEXT,
    "lastWeekLesson" TEXT,
    "strengthsUsed" TEXT,
    "improvementWhen" TEXT,
    "improvementThen" TEXT,
    "improvementExtra" TEXT,
    "mentalAfter" INTEGER,
    "whatShapedIt" TEXT,
    "deliberatePractice" TEXT,
    "processScore" INTEGER,
    "pl" TEXT,
    "overallScore" INTEGER,
    "proudOf" TEXT,
    "ashamedOf" TEXT,
    "tomorrowRemember" TEXT,
    "setupsScore" INTEGER,
    "executionScore" INTEGER,
    "riskScore" INTEGER,
    "psychologyScore" INTEGER,
    "disciplineScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "dailyCardId" TEXT NOT NULL,
    "time" TEXT,
    "trigger" TEXT,
    "setup" TEXT,
    "direction" TEXT,
    "tier" TEXT,
    "rExpected" DOUBLE PRECISION,
    "rActual" DOUBLE PRECISION,
    "decision" TEXT,
    "emotion" TEXT,
    "lessons" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmotionEntry" (
    "id" TEXT NOT NULL,
    "dailyCardId" TEXT NOT NULL,
    "time" TEXT,
    "emotion" TEXT,
    "triggerContext" TEXT,
    "meaningSignal" TEXT,
    "reaction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmotionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "weekEnd" DATE NOT NULL,
    "bridgeStrategicTopic" TEXT,
    "bridgePreMortemItems" JSONB,
    "processGoalNextWeek" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalibrationGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "sourceId" TEXT,
    "goalText" TEXT NOT NULL,
    "probabilityAssigned" INTEGER NOT NULL,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluatedAt" TIMESTAMP(3),
    "outcome" TEXT,

    CONSTRAINT "CalibrationGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCard_userId_date_key" ON "DailyCard"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReview_userId_weekStart_key" ON "WeeklyReview"("userId", "weekStart");

-- AddForeignKey
ALTER TABLE "DailyCard" ADD CONSTRAINT "DailyCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_dailyCardId_fkey" FOREIGN KEY ("dailyCardId") REFERENCES "DailyCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmotionEntry" ADD CONSTRAINT "EmotionEntry_dailyCardId_fkey" FOREIGN KEY ("dailyCardId") REFERENCES "DailyCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReview" ADD CONSTRAINT "WeeklyReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationGoal" ADD CONSTRAINT "CalibrationGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
