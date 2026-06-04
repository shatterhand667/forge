import { describe, it, expect } from "vitest"
import { sortRows } from "@/components/statistics/SortableStatsTable"
import type { StatsRow } from "@/components/statistics/SortableStatsTable"

const r = (overrides: Partial<StatsRow> = {}): StatsRow => ({
  id: "1",
  name: "Breakout",
  trades: 10,
  winRate: 0.6,
  avgR: 1.2,
  totalPnL: 200,
  profitFactor: 2.5,
  long: 7,
  short: 3,
  tierA: 5,
  tierB: 3,
  tierC: 2,
  ...overrides,
})

describe("sortRows", () => {
  it("sorts by trades descending", () => {
    const rows = [r({ id: "a", trades: 5 }), r({ id: "b", trades: 10 }), r({ id: "c", trades: 1 })]
    const result = sortRows(rows, "trades", "desc")
    expect(result.map(r => r.trades)).toEqual([10, 5, 1])
  })

  it("sorts by trades ascending", () => {
    const rows = [r({ id: "a", trades: 5 }), r({ id: "b", trades: 10 }), r({ id: "c", trades: 1 })]
    const result = sortRows(rows, "trades", "asc")
    expect(result.map(r => r.trades)).toEqual([1, 5, 10])
  })

  it("sorts by name ascending", () => {
    const rows = [r({ id: "a", name: "Zebra" }), r({ id: "b", name: "Alpha" }), r({ id: "c", name: "Mid" })]
    const result = sortRows(rows, "name", "asc")
    expect(result.map(r => r.name)).toEqual(["Alpha", "Mid", "Zebra"])
  })

  it("sorts by name descending", () => {
    const rows = [r({ id: "a", name: "Zebra" }), r({ id: "b", name: "Alpha" }), r({ id: "c", name: "Mid" })]
    const result = sortRows(rows, "name", "desc")
    expect(result.map(r => r.name)).toEqual(["Zebra", "Mid", "Alpha"])
  })

  it("places null winRate last when sorting desc", () => {
    const rows = [r({ id: "a", winRate: null }), r({ id: "b", winRate: 0.8 }), r({ id: "c", winRate: 0.3 })]
    const result = sortRows(rows, "winRate", "desc")
    expect(result[2].winRate).toBeNull()
  })

  it("places null winRate last when sorting asc", () => {
    const rows = [r({ id: "a", winRate: null }), r({ id: "b", winRate: 0.8 }), r({ id: "c", winRate: 0.3 })]
    const result = sortRows(rows, "winRate", "asc")
    expect(result[2].winRate).toBeNull()
  })

  it("sorts profitFactor: Infinity ('∞') highest, null ('—') last", () => {
    const rows = [
      r({ id: "a", profitFactor: "—" }),
      r({ id: "b", profitFactor: 1.5 }),
      r({ id: "c", profitFactor: "∞" }),
    ]
    const result = sortRows(rows, "profitFactor", "desc")
    expect(result[0].profitFactor).toBe("∞")
    expect(result[1].profitFactor).toBe(1.5)
    expect(result[2].profitFactor).toBe("—")
  })
})
