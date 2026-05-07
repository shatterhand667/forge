import { prisma } from "@/lib/db"

export interface WeeklyStats {
  trades: number
  winRate: number
  avgR: number
  profitFactor: number
  bestR: number
  worstR: number
  sleepAvg: number
  byTier: {
    A: TierStats
    B: TierStats
    C: TierStats
  }
  byDay: {
    mon: DayStats
    tue: DayStats
    wed: DayStats
    thu: DayStats
    fri: DayStats
  }
  mentalPerDay: Array<number | null>
}

interface TierStats {
  trades: number
  winRate: number
  avgR: number
  netR: number
}

interface DayStats {
  processScore: number | null
  pl: string | null
  mentalAfter: number | null
}

function calcTierStats(trades: { rActual: number | null }[]): TierStats {
  const withR = trades.filter((t) => t.rActual !== null) as { rActual: number }[]
  if (withR.length === 0) return { trades: trades.length, winRate: 0, avgR: 0, netR: 0 }
  const wins = withR.filter((t) => t.rActual > 0)
  const netR = withR.reduce((sum, t) => sum + t.rActual, 0)
  return {
    trades: trades.length,
    winRate: wins.length / withR.length,
    avgR: netR / withR.length,
    netR,
  }
}

const DAY_INDEX_TO_KEY: Record<number, keyof WeeklyStats["byDay"]> = {
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
}

function emptyDayStats(): DayStats {
  return { processScore: null, pl: null, mentalAfter: null }
}

export async function computeWeeklyStats(
  userId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<WeeklyStats> {
  const cards = await prisma.dailyCard.findMany({
    where: { userId, date: { gte: weekStart, lte: weekEnd } },
    include: { trades: true },
    orderBy: { date: "asc" },
  })

  const allTrades = cards.flatMap((c) => c.trades)
  const withR = allTrades.filter((t) => t.rActual !== null) as (Omit<(typeof allTrades)[number], "rActual"> & { rActual: number })[]

  const wins = withR.filter((t) => t.rActual > 0)
  const losses = withR.filter((t) => t.rActual < 0)
  const totalR = withR.reduce((sum, t) => sum + t.rActual, 0)
  const grossWin = wins.reduce((sum, t) => sum + t.rActual, 0)
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.rActual, 0))

  const sleepValues = cards.filter((c) => c.sleep !== null).map((c) => c.sleep as number)
  const sleepAvg =
    sleepValues.length > 0 ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length : 0

  const tierGroups: Record<"A" | "B" | "C", typeof allTrades> = { A: [], B: [], C: [] }
  for (const trade of allTrades) {
    const tier = trade.tier as "A" | "B" | "C" | null
    if (tier && tier in tierGroups) tierGroups[tier].push(trade)
  }

  const byDay: WeeklyStats["byDay"] = {
    mon: emptyDayStats(),
    tue: emptyDayStats(),
    wed: emptyDayStats(),
    thu: emptyDayStats(),
    fri: emptyDayStats(),
  }
  for (const card of cards) {
    const dow = new Date(card.date).getUTCDay()
    const key = DAY_INDEX_TO_KEY[dow]
    if (key) {
      byDay[key] = {
        processScore: card.processScore,
        pl: card.pl,
        mentalAfter: card.mentalAfter,
      }
    }
  }

  return {
    trades: allTrades.length,
    winRate: withR.length > 0 ? wins.length / withR.length : 0,
    avgR: withR.length > 0 ? totalR / withR.length : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : 0,
    bestR: withR.length > 0 ? Math.max(...withR.map((t) => t.rActual)) : 0,
    worstR: withR.length > 0 ? Math.min(...withR.map((t) => t.rActual)) : 0,
    sleepAvg,
    byTier: {
      A: calcTierStats(tierGroups.A),
      B: calcTierStats(tierGroups.B),
      C: calcTierStats(tierGroups.C),
    },
    byDay,
    mentalPerDay: (["mon", "tue", "wed", "thu", "fri"] as const).map(
      (k) => byDay[k].mentalAfter
    ),
  }
}
