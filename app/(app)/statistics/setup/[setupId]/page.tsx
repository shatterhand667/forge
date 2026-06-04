import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Suspense } from "react"
import { StatisticsFilter } from "@/components/statistics/StatisticsFilter"
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
  const thStyle = (extra?: React.CSSProperties): React.CSSProperties =>
    ({ ...thBase, background: "var(--color-mid)", ...extra })
  const tdStyle = (extra?: React.CSSProperties): React.CSSProperties =>
    ({ ...tdBase, ...extra })

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
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
                <thead>
                  <tr>
                    <th style={thStyle({ textAlign: "left" })}>Trigger</th>
                    <th style={thStyle({ width: 60 })}>Trades</th>
                    <th style={thStyle({ width: 72 })}>Win Rate</th>
                    <th style={thStyle({ width: 60 })}>Avg R</th>
                    <th style={thStyle({ width: 80 })}>P&amp;L ($)</th>
                    <th style={thStyle({ width: 76 })}>P. Factor</th>
                    <th style={thStyle({ width: 48 })}>Long</th>
                    <th style={thStyle({ width: 48 })}>Short</th>
                    <th style={thStyle({ width: 48 })}>Tier A</th>
                    <th style={thStyle({ width: 48 })}>Tier B</th>
                    <th style={thStyle({ width: 48 })}>Tier C</th>
                  </tr>
                </thead>
                <tbody>
                  {triggerStats.map((s) => (
                    <tr
                      key={s.triggerId ?? "__none__"}
                      style={{
                        background:
                          s.triggerId === null ? "var(--color-light)" : "var(--color-white)",
                      }}
                    >
                      <td
                        style={tdStyle({
                          textAlign: "left",
                          fontWeight: s.triggerId === null ? 400 : 600,
                          color:
                            s.triggerId === null
                              ? "var(--color-muted)"
                              : "var(--color-text)",
                        })}
                      >
                        {s.triggerName}
                      </td>
                      <td style={tdStyle()}>{s.trades}</td>
                      <td
                        style={tdStyle({
                          color:
                            s.winRate !== null
                              ? s.winRate >= 0.5
                                ? "#2D8C4E"
                                : "#D96060"
                              : "var(--color-muted)",
                        })}
                      >
                        {pct(s.winRate)}
                      </td>
                      <td
                        style={tdStyle({
                          color:
                            s.avgR !== null
                              ? s.avgR > 0
                                ? "#2D8C4E"
                                : s.avgR < 0
                                ? "#D96060"
                                : undefined
                              : "var(--color-muted)",
                        })}
                      >
                        {s.avgR !== null ? s.avgR.toFixed(2) : "—"}
                      </td>
                      <td
                        style={tdStyle({
                          color:
                            s.totalPnL > 0
                              ? "#2D8C4E"
                              : s.totalPnL < 0
                              ? "#D96060"
                              : undefined,
                        })}
                      >
                        {s.totalPnL > 0 ? "+" : ""}
                        {s.totalPnL.toFixed(2)}
                      </td>
                      <td style={tdStyle()}>{pf(s.profitFactor)}</td>
                      <td style={tdStyle()}>{s.long || "—"}</td>
                      <td style={tdStyle()}>{s.short || "—"}</td>
                      <td style={tdStyle()}>{s.tierA || "—"}</td>
                      <td style={tdStyle()}>{s.tierB || "—"}</td>
                      <td style={tdStyle()}>{s.tierC || "—"}</td>
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
