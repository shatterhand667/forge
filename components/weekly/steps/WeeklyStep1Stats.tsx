"use client"
import { useState } from "react"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, BridgeIndicator } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

function fmt(n: number, decimals = 2) {
  return n === 0 ? "—" : n.toFixed(decimals)
}

function pct(n: number) {
  return n === 0 ? "—" : `${(n * 100).toFixed(0)}%`
}

export function WeeklyStep1Stats({ review, stats, weekStart, step }: Props) {
  const [maxDrawdown, setMaxDrawdown] = useState(review.maxDrawdown ?? "")
  const [netPL, setNetPL] = useState(review.netPL ?? "")

  async function handleSave(field: "maxDrawdown" | "netPL", value: string) {
    await updateWeeklyReview(review.id, { [field]: value || undefined })
  }

  return (
    <WeeklyLayout
      weekStart={weekStart}
      currentStep={step}
      totalSteps={11}
      stepLabel="Statystyki tygodnia"
      prevHref="/dashboard"
      nextHref={`/weekly/${weekStart}/step/2`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="1" title="STATYSTYKI TYGODNIA" />
        <BridgeIndicator source="z kart dziennych" />

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--font-size-tiny)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--color-muted)" }}></th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Tradów</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Win%</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Avg R</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>PF</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Best R</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Worst R</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Max DD</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Net P&L</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Sen (h)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "6px 8px", fontWeight: 600, color: "var(--color-text)" }}>Ten tydzień</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{stats.trades}</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{pct(stats.winRate)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{fmt(stats.avgR)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{fmt(stats.profitFactor)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{fmt(stats.bestR)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{fmt(stats.worstR)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>
                  <input
                    value={maxDrawdown}
                    onChange={e => setMaxDrawdown(e.target.value)}
                    onBlur={() => handleSave("maxDrawdown", maxDrawdown)}
                    placeholder="—"
                    style={{
                      width: 60,
                      textAlign: "center",
                      border: "none",
                      borderBottom: "1px solid var(--color-border)",
                      background: "transparent",
                      fontSize: "var(--font-size-tiny)",
                      color: "var(--color-text)",
                    }}
                  />
                </td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>
                  <input
                    value={netPL}
                    onChange={e => setNetPL(e.target.value)}
                    onBlur={() => handleSave("netPL", netPL)}
                    placeholder="—"
                    style={{
                      width: 70,
                      textAlign: "center",
                      border: "none",
                      borderBottom: "1px solid var(--color-border)",
                      background: "transparent",
                      fontSize: "var(--font-size-tiny)",
                      color: "var(--color-text)",
                    }}
                  />
                </td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{fmt(stats.sleepAvg, 1)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", fontStyle: "italic" }}>
          Max DD i Net P&L wpisz ręcznie (z platformy brokerskiej).
        </p>
      </div>
    </WeeklyLayout>
  )
}
