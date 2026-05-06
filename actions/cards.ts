"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getYesterdayLesson, getLastWeekLesson, getYesterdayMentorComment } from "@/lib/bridges"
import { revalidatePath } from "next/cache"
import type { CardStatus } from "@prisma/client"

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function getOrCreateDailyCard(dateStr: string) {
  const userId = await requireUser()
  const date = new Date(dateStr)

  const [yesterdayLesson, lastWeekLesson, yesterdayMentorComment] = await Promise.all([
    getYesterdayLesson(userId, date),
    getLastWeekLesson(userId, date),
    getYesterdayMentorComment(userId, date),
  ])

  return prisma.dailyCard.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, yesterdayLesson, lastWeekLesson, yesterdayMentorComment },
    update: {},
    include: {
      trades: { orderBy: { createdAt: "asc" } },
      emotionEntries: { orderBy: { createdAt: "asc" } },
    },
  })
}

export async function updateDailyCard(
  id: string,
  data: Partial<{
    sleep: number; energy: number; focus: number; prepQuality: number; moodNotes: string
    trendBias: string; keyLevels: string; macroNews: string; correlations: string
    whatIfs: string; entryConditions: string; tierASetup: string; tierBSetup: string; tierCSetup: string
    preMortem: string; dailyGoal: string
    strengthsUsed: string; improvementWhen: string; improvementThen: string; improvementExtra: string
    mentalAfter: number; whatShapedIt: string; deliberatePractice: string
    processScore: number; pl: string; overallScore: number
    proudOf: string; ashamedOf: string; tomorrowRemember: string
    setupsScore: number; executionScore: number; riskScore: number; psychologyScore: number; disciplineScore: number
    status: CardStatus
  }>
) {
  const userId = await requireUser()

  const card = await prisma.dailyCard.findFirst({ where: { id, userId } })
  if (!card) throw new Error("Card not found")

  await prisma.dailyCard.update({ where: { id }, data })
  revalidatePath("/dashboard")
}

export async function updateMentorComment(id: string, mentorComment: string) {
  const userId = await requireUser()
  const card = await prisma.dailyCard.findFirst({ where: { id, userId } })
  if (!card) throw new Error("Card not found")
  await prisma.dailyCard.update({
    where: { id },
    data: { mentorComment: mentorComment.trim() || null },
  })
  revalidatePath("/dashboard")
  revalidatePath("/cards", "layout")
}

export async function getDailyCard(dateStr: string) {
  const userId = await requireUser()
  const date = new Date(dateStr)

  return prisma.dailyCard.findUnique({
    where: { userId_date: { userId, date } },
    include: {
      trades: { orderBy: { createdAt: "asc" } },
      emotionEntries: { orderBy: { createdAt: "asc" } },
    },
  })
}

export async function getDailyCardsByMonth(year: number, month: number) {
  const userId = await requireUser()
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)

  return prisma.dailyCard.findMany({
    where: { userId, date: { gte: start, lte: end } },
    select: { date: true, status: true },
    orderBy: { date: "asc" },
  })
}
