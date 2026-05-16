export type TradeForStats = {
  playbookSetupId: string | null
  playbookSetup: { name: string } | null
  direction: string | null
  tier: string | null
  rActual: number | null
  profitRaw: number | null
}

export type SetupStats = {
  setupId: string | null
  setupName: string
  trades: number
  winRate: number | null
  avgR: number | null
  totalPnL: number
  profitFactor: number | string
  long: number
  short: number
  tierA: number
  tierB: number
  tierC: number
}

export type GlobalStats = {
  trades: number
  winRate: number | null
  avgR: number | null
  totalPnL: number
  profitFactor: number | string
}

function pfactor(trades: TradeForStats[]): number | string {
  const withPnL = trades.filter(t => t.profitRaw !== null)
  if (withPnL.length === 0) return "—"
  const grossProfit = withPnL.filter(t => t.profitRaw! > 0).reduce((s, t) => s + t.profitRaw!, 0)
  const grossLoss = Math.abs(withPnL.filter(t => t.profitRaw! < 0).reduce((s, t) => s + t.profitRaw!, 0))
  if (grossLoss === 0) return grossProfit > 0 ? "∞" : "—"
  return Math.round((grossProfit / grossLoss) * 100) / 100
}

export function computeSetupStats(trades: TradeForStats[]): SetupStats[] {
  const groups = new Map<string | null, TradeForStats[]>()
  for (const trade of trades) {
    const key = trade.playbookSetupId
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(trade)
  }

  const results: SetupStats[] = []
  for (const [setupId, g] of groups) {
    const withR = g.filter(t => t.rActual !== null)
    const wins = withR.filter(t => t.rActual! > 0)
    const winRate = withR.length > 0 ? wins.length / withR.length : null
    const avgR =
      withR.length > 0
        ? Math.round((withR.reduce((s, t) => s + t.rActual!, 0) / withR.length) * 100) / 100
        : null
    const totalPnL =
      Math.round(g.filter(t => t.profitRaw !== null).reduce((s, t) => s + t.profitRaw!, 0) * 100) / 100

    results.push({
      setupId,
      setupName: setupId === null ? "Bez setupu" : (g[0].playbookSetup?.name ?? "Bez setupu"),
      trades: g.length,
      winRate,
      avgR,
      totalPnL,
      profitFactor: pfactor(g),
      long: g.filter(t => t.direction === "long").length,
      short: g.filter(t => t.direction === "short").length,
      tierA: g.filter(t => t.tier === "A").length,
      tierB: g.filter(t => t.tier === "B").length,
      tierC: g.filter(t => t.tier === "C").length,
    })
  }

  return results.sort((a, b) => {
    if (a.setupId === null) return 1
    if (b.setupId === null) return -1
    return b.trades - a.trades
  })
}

export function computeGlobalStats(trades: TradeForStats[]): GlobalStats {
  if (trades.length === 0) return { trades: 0, winRate: null, avgR: null, totalPnL: 0, profitFactor: "—" }
  const withR = trades.filter(t => t.rActual !== null)
  const wins = withR.filter(t => t.rActual! > 0)
  const winRate = withR.length > 0 ? wins.length / withR.length : null
  const avgR =
    withR.length > 0
      ? Math.round((withR.reduce((s, t) => s + t.rActual!, 0) / withR.length) * 100) / 100
      : null
  const totalPnL =
    Math.round(trades.filter(t => t.profitRaw !== null).reduce((s, t) => s + t.profitRaw!, 0) * 100) / 100
  return { trades: trades.length, winRate, avgR, totalPnL, profitFactor: pfactor(trades) }
}
