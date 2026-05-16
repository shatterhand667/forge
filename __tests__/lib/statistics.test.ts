import { describe, it, expect } from "vitest"
import { computeSetupStats, computeGlobalStats } from "@/lib/statistics"
import type { TradeForStats } from "@/lib/statistics"

const t = (overrides: Partial<TradeForStats> = {}): TradeForStats => ({
  playbookSetupId: "s1",
  playbookSetup: { name: "Breakout" },
  direction: "long",
  tier: "A",
  rActual: 1.0,
  profitRaw: 100,
  ...overrides,
})

describe("computeSetupStats", () => {
  it("groups trades by setup and computes basic stats", () => {
    const trades = [
      t({ rActual: 1.0, profitRaw: 100 }),
      t({ rActual: -0.5, profitRaw: -50 }),
      t({ playbookSetupId: "s2", playbookSetup: { name: "FVG" }, rActual: 2.0, profitRaw: 200 }),
    ]
    const result = computeSetupStats(trades)
    expect(result).toHaveLength(2)
    // s1 has 2 trades, s2 has 1 → s1 first
    expect(result[0].setupName).toBe("Breakout")
    expect(result[0].trades).toBe(2)
    expect(result[0].winRate).toBe(0.5)
    expect(result[0].avgR).toBe(0.25)
    expect(result[0].totalPnL).toBe(50)
    expect(result[0].profitFactor).toBe(2)
  })

  it("returns winRate null when no rActual values", () => {
    const trades = [t({ rActual: null })]
    const result = computeSetupStats(trades)
    expect(result[0].winRate).toBeNull()
    expect(result[0].avgR).toBeNull()
  })

  it("returns profitFactor '∞' when no losing trades", () => {
    const trades = [t({ profitRaw: 100 }), t({ profitRaw: 200 })]
    const result = computeSetupStats(trades)
    expect(result[0].profitFactor).toBe("∞")
  })

  it("returns profitFactor '—' when no profitRaw values", () => {
    const trades = [t({ profitRaw: null })]
    const result = computeSetupStats(trades)
    expect(result[0].profitFactor).toBe("—")
  })

  it("counts long/short and tiers correctly", () => {
    const trades = [
      t({ direction: "long", tier: "A" }),
      t({ direction: "short", tier: "B" }),
      t({ direction: "long", tier: "A" }),
    ]
    const result = computeSetupStats(trades)
    expect(result[0].long).toBe(2)
    expect(result[0].short).toBe(1)
    expect(result[0].tierA).toBe(2)
    expect(result[0].tierB).toBe(1)
    expect(result[0].tierC).toBe(0)
  })

  it("places 'Bez setupu' last regardless of trade count", () => {
    const trades = [
      t({ playbookSetupId: null, playbookSetup: null }),
      t({ playbookSetupId: null, playbookSetup: null }),
      t({ playbookSetupId: null, playbookSetup: null }),
      t({ playbookSetupId: "s1", playbookSetup: { name: "Breakout" } }),
    ]
    const result = computeSetupStats(trades)
    expect(result[result.length - 1].setupId).toBeNull()
    expect(result[result.length - 1].setupName).toBe("Bez setupu")
  })
})

describe("computeGlobalStats", () => {
  it("computes totals across all trades", () => {
    const trades = [
      t({ rActual: 1.0, profitRaw: 100 }),
      t({ rActual: -0.5, profitRaw: -50 }),
    ]
    const result = computeGlobalStats(trades)
    expect(result.trades).toBe(2)
    expect(result.winRate).toBe(0.5)
    expect(result.avgR).toBe(0.25)
    expect(result.totalPnL).toBe(50)
    expect(result.profitFactor).toBe(2)
  })

  it("handles empty trade list", () => {
    const result = computeGlobalStats([])
    expect(result.trades).toBe(0)
    expect(result.winRate).toBeNull()
    expect(result.avgR).toBeNull()
    expect(result.totalPnL).toBe(0)
    expect(result.profitFactor).toBe("—")
  })
})
