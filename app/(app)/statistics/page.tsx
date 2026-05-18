import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Suspense } from "react"
import { StatisticsFilter } from "@/components/statistics/StatisticsFilter"
import { computeSetupStats, computeGlobalStats } from "@/lib/statistics"

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
  // Use UTC to avoid local-timezone shift when Prisma maps @db.Date to DATE
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

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const { range, from, to } = await searchParams
  const { start, end } = getDateRange(range, from, to)

  const dateFilter: { gte?: Date; lt?: Date } = {}
  if (start) dateFilter.gte = start
  if (end) dateFilter.lt = end

  const trades = await prisma.trade.findMany({
    where: {
      dailyCard: {
        userId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
    },
    include: {
      playbookSetup: { select: { name: true } },
    },
  })

  const setupStats = computeSetupStats(trades)
  const global = computeGlobalStats(trades)

  const thBase: React.CSSProperties = {
    color: "#fff",
    padding: "5px 8px",
    fontSize: "var(--font-size-tiny)",
    fontWeight: 600,
    textAlign: "center",
    whiteSpace: "nowrap",
  }
  const tdBase: React.CSSProperties = {
    padding: "4px 8px",
    fontSize: "var(--font-size-tiny)",
    textAlign: "center",
    borderBottom: "0.5px solid var(--color-border)",
    verticalAlign: "middle",
  }

  const A = "rgba(0,0,0,0.03)"
  const B = "rgba(80,120,220,0.05)"
  const G = {
    setup:     "transparent",
    trades:    A,
    metrics:   B,
    direction: A,
    tiers:     B,
  }
  const thStyle = (g: keyof typeof G, extra?: React.CSSProperties): React.CSSProperties =>
    ({ ...thBase, background: "var(--color-mid)", ...extra })
  const tdStyle = (g: keyof typeof G, extra?: React.CSSProperties): React.CSSProperties =>
    ({ ...tdBase, background: G[g], ...extra })

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
            href="/dashboard"
            className="font-bold uppercase tracking-widest"
            style={{ color: "var(--color-gold)", fontSize: "var(--font-size-tiny)", textDecoration: "none" }}
          >
            THE FORGE
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
            Statystyki
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
            {/* Global summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {[
                { label: "Transakcji",   value: String(global.trades),       color: "var(--color-text)" },
                { label: "Win Rate",     value: pct(global.winRate),         color: global.winRate !== null ? ((global.winRate >= 0.5) ? "#2D8C4E" : "#D96060") : "var(--color-text)" },
                { label: "Avg R",        value: global.avgR !== null ? global.avgR.toFixed(2) : "—", color: global.avgR !== null ? (global.avgR > 0 ? "#2D8C4E" : global.avgR < 0 ? "#D96060" : "var(--color-text)") : "var(--color-text)" },
                { label: "P&L ($)",      value: global.totalPnL !== 0 ? (global.totalPnL > 0 ? "+" : "") + global.totalPnL.toFixed(2) : "0.00", color: global.totalPnL > 0 ? "#2D8C4E" : global.totalPnL < 0 ? "#D96060" : "var(--color-text)" },
                { label: "Profit Factor", value: pf(global.profitFactor),   color: typeof global.profitFactor === "number" && global.profitFactor >= 1.5 ? "#2D8C4E" : "var(--color-text)" },
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

            {/* Per-setup table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
                <thead>
                  <tr>
                    <th style={thStyle("setup",     { textAlign: "left" })}>Setup</th>
                    <th style={thStyle("trades",    { width: 60 })}>Trades</th>
                    <th style={thStyle("metrics",   { width: 72 })}>Win Rate</th>
                    <th style={thStyle("metrics",   { width: 60 })}>Avg R</th>
                    <th style={thStyle("metrics",   { width: 80 })}>P&amp;L ($)</th>
                    <th style={thStyle("metrics",   { width: 76 })}>P. Factor</th>
                    <th style={thStyle("direction", { width: 48 })}>Long</th>
                    <th style={thStyle("direction", { width: 48 })}>Short</th>
                    <th style={thStyle("tiers",     { width: 48 })}>Tier A</th>
                    <th style={thStyle("tiers",     { width: 48 })}>Tier B</th>
                    <th style={thStyle("tiers",     { width: 48 })}>Tier C</th>
                  </tr>
                </thead>
                <tbody>
                  {setupStats.map((s) => (
                    <tr
                      key={s.setupId ?? "__none__"}
                      style={{
                        background: s.setupId === null ? "var(--color-light)" : "var(--color-white)",
                      }}
                    >
                      <td style={tdStyle("setup", { textAlign: "left", fontWeight: s.setupId === null ? 400 : 600, color: s.setupId === null ? "var(--color-muted)" : "var(--color-text)" })}>
                        {s.setupName}
                      </td>
                      <td style={tdStyle("trades")}>{s.trades}</td>
                      <td style={tdStyle("metrics", { color: s.winRate !== null ? (s.winRate >= 0.5 ? "#2D8C4E" : "#D96060") : "var(--color-muted)" })}>
                        {pct(s.winRate)}
                      </td>
                      <td style={tdStyle("metrics", { color: s.avgR !== null ? (s.avgR > 0 ? "#2D8C4E" : s.avgR < 0 ? "#D96060" : undefined) : "var(--color-muted)" })}>
                        {s.avgR !== null ? s.avgR.toFixed(2) : "—"}
                      </td>
                      <td style={tdStyle("metrics", { color: s.totalPnL > 0 ? "#2D8C4E" : s.totalPnL < 0 ? "#D96060" : undefined })}>
                        {s.totalPnL > 0 ? "+" : ""}{s.totalPnL.toFixed(2)}
                      </td>
                      <td style={tdStyle("metrics")}>{pf(s.profitFactor)}</td>
                      <td style={tdStyle("direction")}>{s.long || "—"}</td>
                      <td style={tdStyle("direction")}>{s.short || "—"}</td>
                      <td style={tdStyle("tiers")}>{s.tierA || "—"}</td>
                      <td style={tdStyle("tiers")}>{s.tierB || "—"}</td>
                      <td style={tdStyle("tiers")}>{s.tierC || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
