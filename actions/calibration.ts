"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function upsertCalibrationGoal(
  weekStart: string,
  goalText: string,
  probability: number
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const existing = await prisma.calibrationGoal.findFirst({
    where: { userId, layer: "weekly", sourceId: weekStart },
  })

  if (existing) {
    await prisma.calibrationGoal.update({
      where: { id: existing.id },
      data: { goalText, probabilityAssigned: probability },
    })
  } else {
    await prisma.calibrationGoal.create({
      data: { userId, layer: "weekly", sourceId: weekStart, goalText, probabilityAssigned: probability },
    })
  }
  revalidatePath("/dashboard")
}

export async function evaluateGoal(id: string, outcome: "achieved" | "not_achieved") {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.calibrationGoal.update({
    where: { id },
    data: { outcome, evaluatedAt: new Date() },
  })
  revalidatePath("/dashboard")
}

export async function getCalibrationGoals() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.calibrationGoal.findMany({
    where: { userId: session.user.id },
    orderBy: { setAt: "desc" },
  })
}

export async function upsertDailyOutcome(goalId: string, date: string, achieved: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const goal = await prisma.calibrationGoal.findUnique({ where: { id: goalId } })
  if (!goal || goal.userId !== session.user.id) throw new Error("Not found")

  const existing = Array.isArray(goal.dailyOutcomes)
    ? (goal.dailyOutcomes as { date: string; achieved: boolean }[])
    : []
  const updated = existing.some((d) => d.date === date)
    ? existing.map((d) => d.date === date ? { ...d, achieved } : d)
    : [...existing, { date, achieved }]

  const outcomeScore = updated.reduce((sum, d) => sum + (d.achieved ? 1 : 0), 0) / updated.length

  await prisma.calibrationGoal.update({
    where: { id: goalId },
    data: { dailyOutcomes: updated as any, outcomeScore },
  })
  revalidatePath("/dashboard")
}

export async function getCurrentWeekGoal(weekStart: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.calibrationGoal.findFirst({
    where: { userId: session.user.id, layer: "weekly", sourceId: weekStart },
  })
}

export async function getPrevWeekGoal(currentWeekStart: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const [y, m, d] = currentWeekStart.split("-").map(Number)
  const prev = new Date(Date.UTC(y, m - 1, d - 7))
  const prevStr = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}-${String(prev.getUTCDate()).padStart(2, "0")}`

  return prisma.calibrationGoal.findFirst({
    where: { userId: session.user.id, layer: "weekly", sourceId: prevStr },
  })
}
