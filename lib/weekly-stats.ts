import { prisma } from "@/lib/db"

export interface WeeklyStats {
  sessionCount: number
  trades: number
  winRate: number
  avgR: number
  profitFactor: number
  bestR: number
  worstR: number
  totalPnL: number
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
  energyAvg: number | null
  focusAvg: number | null
  prepQualityAvg: number | null
  processAvg: number | null
  mentalAvg: number | null
  overallAvg: number | null
}

interface TierStats {
  trades: number
  winRate: number
  avgR: number
  netR: number
}

interface DayStats {
  processScore: number | null
  pl: number | null
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

function avg(vals: (number | null)[]): number | null {
  const nonNull = vals.filter((v): v is number => v !== null)
  return nonNull.length > 0 ? Math.round((nonNull.reduce((a, b) => a + b, 0) / nonNull.length) * 10) / 10 : null
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
  const totalPnL = Math.round(allTrades.reduce((sum, t) => sum + (t.profitRaw ?? 0), 0) * 100) / 100
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
      const dayPnL = card.trades.reduce((sum, t) => sum + (t.profitRaw ?? 0), 0)
      byDay[key] = {
        processScore: card.processScore,
        pl: card.trades.length > 0 ? Math.round(dayPnL * 100) / 100 : null,
        mentalAfter: card.mentalAfter,
      }
    }
  }

  return {
    sessionCount: cards.length,
    trades: allTrades.length,
    winRate: withR.length > 0 ? wins.length / withR.length : 0,
    avgR: withR.length > 0 ? totalR / withR.length : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : 0,
    bestR: withR.length > 0 ? Math.max(...withR.map((t) => t.rActual)) : 0,
    worstR: withR.length > 0 ? Math.min(...withR.map((t) => t.rActual)) : 0,
    totalPnL,
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
    energyAvg: avg(cards.map((c) => c.energy)),
    focusAvg: avg(cards.map((c) => c.focus)),
    prepQualityAvg: avg(cards.map((c) => c.prepQuality)),
    processAvg: avg(Object.values(byDay).map((d) => d.processScore)),
    mentalAvg: avg(Object.values(byDay).map((d) => d.mentalAfter)),
    overallAvg: avg(cards.map((c) => c.overallScore)),
  }
}
