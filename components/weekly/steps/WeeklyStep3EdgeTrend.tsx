"use client"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, BridgeIndicator } from "@/components/forge"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"
import type { EdgeWeekData } from "@/actions/weekly"

interface Props {
  review: WeeklyReview
  stats: WeeklyStats
  weekStart: string
  step: number
  edgeTrend: EdgeWeekData[]
}

function pct(n: number) { return n === 0 ? "—" : `${(n * 100).toFixed(0)}%` }
function fmt(n: number) { return n === 0 ? "—" : n.toFixed(2) }

function trendArrow(data: EdgeWeekData[], getRaw: (w: EdgeWeekData) => number): string {
  if (data.length < 2) return "→"
  const last = getRaw(data[data.length - 1])
  const prev = getRaw(data[data.length - 2])
  const delta = last - prev
  if (delta > 0.05) return "↗"
  if (delta < -0.05) return "↘"
  return "→"
}

export function WeeklyStep3EdgeTrend({ review, stats, weekStart, step, edgeTrend }: Props) {
  const thisWeek: EdgeWeekData = {
    label: "Ten tydz.",
    winRate: stats.winRate,
    avgR: stats.avgR,
    profitFactor: stats.profitFactor,
  }
  const allWeeks = [...edgeTrend, thisWeek]

  const rows = [
    { label: "Win rate",      getDisplay: (w: EdgeWeekData) => pct(w.winRate),      getRaw: (w: EdgeWeekData) => w.winRate },
    { label: "Avg R",         getDisplay: (w: EdgeWeekData) => fmt(w.avgR),         getRaw: (w: EdgeWeekData) => w.avgR },
    { label: "Profit factor", getDisplay: (w: EdgeWeekData) => fmt(w.profitFactor), getRaw: (w: EdgeWeekData) => w.profitFactor },
  ]

  return (
    <WeeklyLayout
      weekStart={weekStart}
      currentStep={step}
      totalSteps={11}
      stepLabel="Trend edge"
      prevHref={`/weekly/${weekStart}/step/2`}
      nextHref={`/weekly/${weekStart}/step/4`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="4" title="TREND EDGE — 4 OSTATNIE TYGODNIE" />
        <BridgeIndicator source="z poprzednich Weekly Review" />

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--font-size-tiny)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--color-muted)" }}></th>
                {allWeeks.map((w, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "4px 8px",
                      color: i === allWeeks.length - 1 ? "var(--color-text)" : "var(--color-muted)",
                      fontWeight: i === allWeeks.length - 1 ? 700 : 400,
                    }}
                  >
                    {w.label}
                  </th>
                ))}
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ label, getDisplay, getRaw }) => (
                <tr key={label} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "6px 8px", fontWeight: 600 }}>{label}</td>
                  {allWeeks.map((w, i) => (
                    <td key={i} style={{ padding: "6px 8px", textAlign: "center" }}>{getDisplay(w)}</td>
                  ))}
                  <td style={{ padding: "6px 8px", textAlign: "center", fontSize: 16 }}>
                    {trendArrow(allWeeks, getRaw)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", fontStyle: "italic" }}>
          Cztery złe tygodnie z rzędu = sygnał do rewizji systemu.
        </p>
      </div>
    </WeeklyLayout>
  )
}
