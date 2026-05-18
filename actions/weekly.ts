"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getLastWeeklyReview } from "@/lib/bridges"
import { computeWeeklyStats } from "@/lib/weekly-stats"
import { revalidatePath } from "next/cache"
import type { WeeklyStatus } from "@prisma/client"
import { Prisma } from "@prisma/client"

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function getOrCreateWeeklyReview(weekStartStr: string) {
  const userId = await requireUser()
  const weekStart = new Date(weekStartStr)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 4) // Mon → Fri

  const lastWeekly = await getLastWeeklyReview(userId, weekStart)
  const lastWeekGoalRecap = lastWeekly?.processGoalNextWeek ?? null

  return prisma.weeklyReview.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    create: { userId, weekStart, weekEnd, lastWeekGoalRecap },
    update: { lastWeekGoalRecap },
  })
}

export async function updateWeeklyReview(
  id: string,
  data: Partial<{
    status: WeeklyStatus
    maxDrawdown: string
    netPL: string
    tierAConclusion: string
    tierBConclusion: string
    tierCConclusion: string
    monObservation: string
    tueObservation: string
    wedObservation: string
    thuObservation: string
    friObservation: string
    bestTradeWhy: string
    worstTradeWhatWentWrong: string
    lesson1: string
    lesson2: string
    lesson3: string
    gratitude: string
    patternWhenStrongest: string
    identityWasThatTrader: string
    identityWasNot: string
    threatsMap: string
    repeatingErrors: Prisma.InputJsonValue
    renewedMe: string
    drainedMe: string
    bridgeStrategicTopic: string
    bridgePreMortemItems: Prisma.InputJsonValue
    lastWeekPracticeCount: number
    lastWeekPracticeWhatWentWrong: string
    practicePlan: Prisma.InputJsonValue
    practiceMeta: string
    lessonApplications: Prisma.InputJsonValue
    oneSentenceSummary: string
    mentorTopic: string
    stopLossThreshold: string
    systemCheck: string
    processGoalProbability: number
    processGoalNextWeek: string
  }>
) {
  const userId = await requireUser()
  const review = await prisma.weeklyReview.findFirst({ where: { id, userId } })
  if (!review) throw new Error("WeeklyReview not found")
  await prisma.weeklyReview.update({ where: { id }, data })
  revalidatePath("/dashboard")
}

export async function getWeeklyReview(weekStartStr: string) {
  const userId = await requireUser()
  const weekStart = new Date(weekStartStr)
  return prisma.weeklyReview.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  })
}

export async function getWeeklyStats(weekStartStr: string) {
  const userId = await requireUser()
  const weekStart = new Date(weekStartStr)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 4)
  return computeWeeklyStats(userId, weekStart, weekEnd)
}

export interface EdgeWeekData {
  label: string
  winRate: number
  avgR: number
  profitFactor: number
}

export async function getEdgeTrend(weekStartStr: string): Promise<EdgeWeekData[]> {
  const userId = await requireUser()
  const currentWeekStart = new Date(weekStartStr)

  const previousReviews = await prisma.weeklyReview.findMany({
    where: { userId, weekStart: { lt: currentWeekStart } },
    orderBy: { weekStart: "desc" },
    take: 4,
    select: { weekStart: true, weekEnd: true },
  })

  const ordered = previousReviews.reverse()

  const results: EdgeWeekData[] = await Promise.all(
    ordered.map(async (r) => {
      const s = await computeWeeklyStats(userId, r.weekStart, r.weekEnd)
      const d = r.weekStart
      return {
        label: `${d.getUTCDate()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
        winRate: s.winRate,
        avgR: s.avgR,
        profitFactor: s.profitFactor,
      }
    })
  )

  return results
}

export async function getWeekLessons(weekStartStr: string) {
  const userId = await requireUser()
  const weekStart = new Date(weekStartStr)
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 5) // Mon–Fri
  return prisma.dailyCard.findMany({
    where: { userId, date: { gte: weekStart, lt: weekEnd } },
    select: { date: true, yesterdayLesson: true },
    orderBy: { date: "asc" },
  })
}

export async function getWeeklyReviewsByMonth(year: number, month: number) {
  const userId = await requireUser()
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return prisma.weeklyReview.findMany({
    where: { userId, weekStart: { gte: start, lte: end } },
    select: { weekStart: true, status: true },
    orderBy: { weekStart: "asc" },
  })
}
