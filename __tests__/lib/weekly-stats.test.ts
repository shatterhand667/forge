import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  prisma: {
    dailyCard: { findMany: vi.fn() },
  },
}))

import { prisma } from "@/lib/db"
import { computeWeeklyStats } from "@/lib/weekly-stats"

const weekStart = new Date("2026-05-04") // Monday
const weekEnd = new Date("2026-05-08")   // Friday

describe("computeWeeklyStats", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns zeros for an empty week", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.trades).toBe(0)
    expect(stats.winRate).toBe(0)
    expect(stats.avgR).toBe(0)
    expect(stats.profitFactor).toBe(0)
    expect(stats.bestR).toBe(0)
    expect(stats.worstR).toBe(0)
    expect(stats.sleepAvg).toBe(0)
    expect(stats.mentalPerDay).toEqual([null, null, null, null, null])
  })

  it("calculates winRate and avgR from trades with rActual", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([
      {
        date: new Date("2026-05-04"), sleep: null, processScore: null, pl: null, mentalAfter: null,
        trades: [
          { rActual: 1.5, tier: "A" },
          { rActual: -0.5, tier: "A" },
          { rActual: 2.0, tier: "B" },
        ],
      } as any,
    ])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.trades).toBe(3)
    expect(stats.winRate).toBeCloseTo(2 / 3)
    expect(stats.avgR).toBeCloseTo(1.0)
    expect(stats.bestR).toBe(2.0)
    expect(stats.worstR).toBe(-0.5)
  })

  it("calculates profitFactor as grossWin / grossLoss", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([
      {
        date: new Date("2026-05-04"), sleep: null, processScore: null, pl: null, mentalAfter: null,
        trades: [
          { rActual: 2.0, tier: "A" },
          { rActual: -1.0, tier: "A" },
        ],
      } as any,
    ])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.profitFactor).toBe(2.0)
  })

  it("returns profitFactor 0 when no losing trades", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([
      {
        date: new Date("2026-05-04"), sleep: null, processScore: null, pl: null, mentalAfter: null,
        trades: [{ rActual: 1.0, tier: "A" }],
      } as any,
    ])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.profitFactor).toBe(0)
  })

  it("groups trades by tier correctly", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([
      {
        date: new Date("2026-05-04"), sleep: null, processScore: null, pl: null, mentalAfter: null,
        trades: [
          { rActual: 1.0, tier: "A" },
          { rActual: 1.0, tier: "A" },
          { rActual: -1.0, tier: "B" },
        ],
      } as any,
    ])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.byTier.A.trades).toBe(2)
    expect(stats.byTier.A.winRate).toBe(1.0)
    expect(stats.byTier.A.netR).toBe(2.0)
    expect(stats.byTier.B.trades).toBe(1)
    expect(stats.byTier.B.winRate).toBe(0)
    expect(stats.byTier.C.trades).toBe(0)
    expect(stats.byTier.C.winRate).toBe(0)
  })

  it("maps cards to correct weekday slots in byDay", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([
      { date: new Date("2026-05-04"), sleep: 7, processScore: 8, pl: "+1.5R", mentalAfter: 6, trades: [] } as any, // Monday
      { date: new Date("2026-05-06"), sleep: 6, processScore: 7, pl: "-0.5R", mentalAfter: 5, trades: [] } as any, // Wednesday
    ])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.byDay.mon).toEqual({ processScore: 8, pl: "+1.5R", mentalAfter: 6 })
    expect(stats.byDay.wed).toEqual({ processScore: 7, pl: "-0.5R", mentalAfter: 5 })
    expect(stats.byDay.tue).toEqual({ processScore: null, pl: null, mentalAfter: null })
    expect(stats.byDay.thu).toEqual({ processScore: null, pl: null, mentalAfter: null })
    expect(stats.byDay.fri).toEqual({ processScore: null, pl: null, mentalAfter: null })
  })

  it("calculates sleepAvg ignoring null days", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([
      { date: new Date("2026-05-04"), sleep: 7, processScore: null, pl: null, mentalAfter: null, trades: [] } as any,
      { date: new Date("2026-05-05"), sleep: 8, processScore: null, pl: null, mentalAfter: null, trades: [] } as any,
      { date: new Date("2026-05-06"), sleep: null, processScore: null, pl: null, mentalAfter: null, trades: [] } as any,
    ])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.sleepAvg).toBe(7.5)
  })

  it("populates mentalPerDay as [mon, tue, wed, thu, fri]", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([
      { date: new Date("2026-05-04"), sleep: null, processScore: null, pl: null, mentalAfter: 7, trades: [] } as any,
      { date: new Date("2026-05-05"), sleep: null, processScore: null, pl: null, mentalAfter: 5, trades: [] } as any,
    ])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.mentalPerDay).toEqual([7, 5, null, null, null])
  })
})
