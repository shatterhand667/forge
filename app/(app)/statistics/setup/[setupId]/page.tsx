import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Suspense } from "react"
import { StatisticsFilter } from "@/components/statistics/StatisticsFilter"
import { SortableStatsTable } from "@/components/statistics/SortableStatsTable"
import type { StatsRow } from "@/components/statistics/SortableStatsTable"
import { computeTriggerStats, computeGlobalStats } from "@/lib/statistics"
import type { TradeForTriggerStats } from "@/lib/statistics"

function getDateRange(
  range: string | undefined,
  from: string | undefined,
  to: string | undefined
): { start: Date | null; end: Date | null } {
  if (from && to) {
    const end = new Date(to)
    end.setUTCDate(end.getUTCDate() + 1)
    return { start: new Date(from), end }
  }
  const now = new Date()
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  switch (range) {
    case "2w": return { start: new Date(now.getTime() - 14 * 86400000), end }
    case "3m": return { start: new Date(now.getTime() - 90 * 86400000), end }
    case "all": return { start: null, end: null }
    default:   return { start: new Date(now.getTime() - 28 * 86400000), end }
  }
}

function pct(n: number | null): string {
  if (n === null) return "—"
  return (n * 100).toFixed(0) + "%"
}

function pf(v: number | string): string {
  if (typeof v === "string") return v
  return v.toFixed(2)
}

export default async function SetupDrilldownPage({
  params,
  searchParams,
}: {
  params: Promise<{ setupId: string }>
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const { setupId } = await params
  const { range, from, to } = await searchParams
  const { start, end } = getDateRange(range, from, to)

  const setup = await prisma.playbookSetup.findFirst({
    where: { id: setupId, playbook: { userId } },
    select: { name: true },
  })

  if (!setup) redirect("/statistics")

  const dateFilter: { gte?: Date; lt?: Date } = {}
  if (start) dateFilter.gte = start
  if (end) dateFilter.lt = end

  const trades = await prisma.trade.findMany({
    where: {
      playbookSetupId: setupId,
      dailyCard: {
        userId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
    },
    include: {
      playbookSetup: { select: { name: true } },
      playbookTrigger: { select: { name: true } },
    },
  }) as TradeForTriggerStats[]

  const triggerStats = computeTriggerStats(trades)
  const global = computeGlobalStats(trades)

  const params2 = new URLSearchParams()
  if (range) params2.set("range", range)
  if (from) params2.set("from", from)
  if (to) params2.set("to", to)
  const qs = params2.toString()

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <header
        className="border-b"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div
          className="mx-auto px-4 py-3 flex items-center justify-between"
          style={{ maxWidth: "var(--content-max-width)" }}
        >
          <Link
            href={`/statistics${qs ? `?${qs}` : ""}`}
            style={{
              color: "var(--color-gold)",
              fontSize: "var(--font-size-tiny)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              textDecoration: "none",
            }}
          >
            ← Statystyki
          </Link>
          <span
            style={{
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-muted)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            {setup.name || "Setup"}
          </span>
        </div>
      </header>

      <main
        className="mx-auto px-4 py-6 flex flex-col gap-6"
        style={{ maxWidth: "var(--content-max-width)" }}
      >
        <Suspense>
          <StatisticsFilter />
        </Suspense>

        {trades.length === 0 ? (
          <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
            Brak transakcji w wybranym okresie.
          </p>
        ) : (
          <>
            {/* Global summary for this setup */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {[
                { label: "Transakcji",    value: String(global.trades),       color: "var(--color-text)" },
                { label: "Win Rate",      value: pct(global.winRate),         color: global.winRate !== null ? (global.winRate >= 0.5 ? "#2D8C4E" : "#D96060") : "var(--color-text)" },
                { label: "Avg R",         value: global.avgR !== null ? global.avgR.toFixed(2) : "—", color: global.avgR !== null ? (global.avgR > 0 ? "#2D8C4E" : global.avgR < 0 ? "#D96060" : "var(--color-text)") : "var(--color-text)" },
                { label: "P&L ($)",       value: global.totalPnL !== 0 ? (global.totalPnL > 0 ? "+" : "") + global.totalPnL.toFixed(2) : "0.00", color: global.totalPnL > 0 ? "#2D8C4E" : global.totalPnL < 0 ? "#D96060" : "var(--color-text)" },
                { label: "Profit Factor", value: pf(global.profitFactor),     color: typeof global.profitFactor === "number" && global.profitFactor >= 1.5 ? "#2D8C4E" : "var(--color-text)" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  style={{
                    background: "var(--color-white)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 4,
                    padding: "10px 8px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--color-muted)",
                      marginTop: 2,
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Per-trigger table */}
            <SortableStatsTable
              rows={triggerStats.map((s): StatsRow => ({
                id: s.triggerId,
                name: s.triggerName,
                trades: s.trades,
                winRate: s.winRate,
                avgR: s.avgR,
                totalPnL: s.totalPnL,
                profitFactor: s.profitFactor,
                long: s.long,
                short: s.short,
                tierA: s.tierA,
                tierB: s.tierB,
                tierC: s.tierC,
              }))}
              firstColumnLabel="Trigger"
            />
          </>
        )}
      </main>
    </div>
  )
}
