import { prisma } from "@/lib/db"

export async function getYesterdayLesson(userId: string, date: Date): Promise<string | null> {
  const card = await prisma.dailyCard.findFirst({
    where: {
      userId,
      date: { lt: date },
      tomorrowRemember: { not: null },
    },
    orderBy: { date: "desc" },
    select: { tomorrowRemember: true },
  })
  return card?.tomorrowRemember ?? null
}

export async function getLastWeekLesson(userId: string, date: Date): Promise<string | null> {
  const weekly = await prisma.weeklyReview.findFirst({
    where: {
      userId,
      weekEnd: { lt: date },
      bridgeStrategicTopic: { not: null },
    },
    orderBy: { weekEnd: "desc" },
    select: { bridgeStrategicTopic: true },
  })
  return weekly?.bridgeStrategicTopic ?? null
}

export async function getBridge2Items(userId: string, date: Date): Promise<string[]> {
  const weekly = await prisma.weeklyReview.findFirst({
    where: {
      userId,
      weekEnd: { lt: date },
    },
    orderBy: { weekEnd: "desc" },
    select: { bridgePreMortemItems: true },
  })
  return (weekly?.bridgePreMortemItems as string[]) ?? []
}

export async function getYesterdayMentorComment(userId: string, date: Date): Promise<string | null> {
  const card = await prisma.dailyCard.findFirst({
    where: {
      userId,
      date: { lt: date },
      mentorComment: { not: null },
    },
    orderBy: { date: "desc" },
    select: { mentorComment: true },
  })
  return card?.mentorComment ?? null
}

export async function getLastWeeklyReview(
  userId: string,
  beforeDate: Date
): Promise<{ processGoalNextWeek: string | null } | null> {
  return prisma.weeklyReview.findFirst({
    where: { userId, weekStart: { lt: beforeDate } },
    orderBy: { weekStart: "desc" },
    select: { processGoalNextWeek: true },
  })
}
