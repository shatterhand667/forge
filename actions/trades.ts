"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function addTrade(
  dailyCardId: string,
  data: {
    time?: string; trigger?: string; setup?: string; direction?: string
    tier?: string; rExpected?: number; rActual?: number; decision?: string
    emotion?: string; lessons?: string
  }
) {
  const userId = await requireUser()
  const card = await prisma.dailyCard.findFirst({ where: { id: dailyCardId, userId } })
  if (!card) throw new Error("Card not found")

  return prisma.trade.create({ data: { dailyCardId, ...data } })
}

export async function updateTrade(
  id: string,
  data: Partial<{
    time: string; trigger: string; setup: string; direction: string; tier: string
    rExpected: number; rActual: number; decision: string; emotion: string; lessons: string
  }>
) {
  const userId = await requireUser()
  const trade = await prisma.trade.findFirst({
    where: { id },
    include: { dailyCard: { select: { userId: true } } },
  })
  if (!trade || trade.dailyCard.userId !== userId) throw new Error("Not found")

  return prisma.trade.update({ where: { id }, data })
}

export async function deleteTrade(id: string) {
  const userId = await requireUser()
  const trade = await prisma.trade.findFirst({
    where: { id },
    include: { dailyCard: { select: { userId: true } } },
  })
  if (!trade || trade.dailyCard.userId !== userId) throw new Error("Not found")

  return prisma.trade.delete({ where: { id } })
}
