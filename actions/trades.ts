"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { parseMT5CSV } from "@/lib/mt5-parser"
import { revalidatePath } from "next/cache"

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function importMT5Trades(dailyCardId: string, csvContent: string) {
  const userId = await requireUser()
  const card = await prisma.dailyCard.findFirst({ where: { id: dailyCardId, userId } })
  if (!card) throw new Error("Card not found")

  const parsed = parseMT5CSV(csvContent)
  if (parsed.length === 0) return []

  const result = await prisma.$transaction(
    parsed.map(t =>
      prisma.trade.create({
        data: {
          dailyCardId,
          time: t.time,
          instrument: t.instrument,
          direction: t.direction,
          volume: t.volume || null,
          profitRaw: t.profitRaw,
        },
      })
    )
  )
  revalidatePath('/statistics')
  return result
}

export async function mergeTrades(ids: string[], dailyCardId: string) {
  const userId = await requireUser()
  const card = await prisma.dailyCard.findFirst({ where: { id: dailyCardId, userId } })
  if (!card) throw new Error("Card not found")

  const trades = await prisma.trade.findMany({
    where: { id: { in: ids }, dailyCardId },
    orderBy: { createdAt: "asc" },
  })
  if (trades.length < 2) return

  const first = trades[0]
  const totalProfit = trades.reduce((sum, t) => sum + (t.profitRaw ?? 0), 0)
  const totalVolume = trades.reduce((sum, t) => sum + (t.volume ?? 0), 0)

  await prisma.trade.update({
    where: { id: first.id },
    data: {
      profitRaw: totalProfit,
      volume: totalVolume > 0 ? totalVolume : null,
    },
  })
  await prisma.trade.deleteMany({ where: { id: { in: ids.filter(id => id !== first.id) } } })
  revalidatePath('/statistics')
  return prisma.trade.findUnique({ where: { id: first.id } })
}

export async function addTrade(
  dailyCardId: string,
  data: {
    time?: string; instrument?: string; trigger?: string; playbookSetupId?: string; direction?: string
    tier?: string; volume?: number; rExpected?: number; rActual?: number; profitRaw?: number; decision?: string
    emotion?: string; lessons?: string
  }
) {
  const userId = await requireUser()
  const card = await prisma.dailyCard.findFirst({ where: { id: dailyCardId, userId } })
  if (!card) throw new Error("Card not found")

  const trade = await prisma.trade.create({ data: { dailyCardId, ...data } })
  revalidatePath('/statistics')
  return trade
}

export async function updateTrade(
  id: string,
  data: Partial<{
    time: string; instrument: string; trigger: string; playbookSetupId: string | null; direction: string; tier: string
    volume: number; rExpected: number; rActual: number; profitRaw: number; decision: string; emotion: string; lessons: string
  }>
) {
  const userId = await requireUser()
  const trade = await prisma.trade.findFirst({
    where: { id },
    include: { dailyCard: { select: { userId: true } } },
  })
  if (!trade || trade.dailyCard.userId !== userId) throw new Error("Not found")

  const updated = await prisma.trade.update({ where: { id }, data })
  revalidatePath('/statistics')
  return updated
}

export async function deleteTrade(id: string) {
  const userId = await requireUser()
  const trade = await prisma.trade.findFirst({
    where: { id },
    include: { dailyCard: { select: { userId: true } } },
  })
  if (!trade || trade.dailyCard.userId !== userId) throw new Error("Not found")

  const deleted = await prisma.trade.delete({ where: { id } })
  revalidatePath('/statistics')
  return deleted
}
