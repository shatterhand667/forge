"use client"
import { useState } from "react"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, BridgeIndicator } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

function pct(n: number) { return n === 0 ? "—" : `${(n * 100).toFixed(0)}%` }
function fmt(n: number) { return n === 0 ? "—" : n.toFixed(2) }

const DAYS = [
  { key: "mon" as const, label: "Poniedziałek" },
  { key: "tue" as const, label: "Wtorek" },
  { key: "wed" as const, label: "Środa" },
  { key: "thu" as const, label: "Czwartek" },
  { key: "fri" as const, label: "Piątek" },
]

export function WeeklyStep2Tiers({ review, stats, weekStart, step }: Props) {
  const [tierA, setTierA] = useState(review.tierAConclusion ?? "")
  const [tierB, setTierB] = useState(review.tierBConclusion ?? "")
  const [tierC, setTierC] = useState(review.tierCConclusion ?? "")
  const [obs, setObs] = useState({
    mon: review.monObservation ?? "",
    tue: review.tueObservation ?? "",
    wed: review.wedObservation ?? "",
    thu: review.thuObservation ?? "",
    fri: review.friObservation ?? "",
  })

  async function saveTier(
    field: "tierAConclusion" | "tierBConclusion" | "tierCConclusion",
    value: string
  ) {
    await updateWeeklyReview(review.id, { [field]: value || undefined })
  }

  async function saveObs(day: keyof typeof obs, value: string) {
    const fieldMap = {
      mon: "monObservation",
      tue: "tueObservation",
      wed: "wedObservation",
      thu: "thuObservation",
      fri: "friObservation",
    } as const
    await updateWeeklyReview(review.id, { [fieldMap[day]]: value || undefined })
  }

  const tiers = [
    { label: "A-setup (100%)", data: stats.byTier.A, conclusion: tierA, setConclusion: setTierA, field: "tierAConclusion" as const },
    { label: "B-setup (50%)",  data: stats.byTier.B, conclusion: tierB, setConclusion: setTierB, field: "tierBConclusion" as const },
    { label: "C-setup (25%)",  data: stats.byTier.C, conclusion: tierC, setConclusion: setTierC, field: "tierCConclusion" as const },
  ]

  return (
    <WeeklyLayout
      weekStart={weekStart}
      currentStep={step}
      totalSteps={11}
      stepLabel="Tier sizing + Heatmapa"
      prevHref={`/weekly/${weekStart}/step/1`}
      nextHref={`/weekly/${weekStart}/step/3`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}
    >
      <div className="flex flex-col gap-6">

        {/* Section 2: Tier sizing */}
        <div>
          <SectionHeader number="2" title="TIER SIZING — CO NAPRAWDĘ DZIAŁA?" />
          <BridgeIndicator source="z kart dziennych" />
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--font-size-tiny)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--color-muted)" }}>Setup</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Tradów</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Win%</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Avg R</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Net R</th>
                  <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--color-muted)" }}>Wniosek</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map(({ label, data, conclusion, setConclusion, field }) => (
                  <tr key={label} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "6px 8px", fontWeight: 600 }}>{label}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>{data.trades}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>{pct(data.winRate)}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>{fmt(data.avgR)}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>{fmt(data.netR)}</td>
                    <td style={{ padding: "6px 8px" }}>
                      <input
                        value={conclusion}
                        onChange={e => setConclusion(e.target.value)}
                        onBlur={() => saveTier(field, conclusion)}
                        placeholder="zwiększyć / zmniejszyć / bez zmian"
                        style={{
                          width: "100%",
                          border: "none",
                          borderBottom: "1px solid var(--color-border)",
                          background: "transparent",
                          fontSize: "var(--font-size-tiny)",
                          padding: "2px 0",
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Day heatmap */}
        <div>
          <SectionHeader number="3" title="DNI TYGODNIA — HEATMAPA PROCESU" />
          <BridgeIndicator source="z kart dziennych" />
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--font-size-tiny)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--color-muted)" }}>Dzień</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Proces</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>P&L (R)</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Mental</th>
                  <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--color-muted)" }}>Obserwacja</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map(({ key, label }) => {
                  const d = stats.byDay[key]
                  return (
                    <tr key={key} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "6px 8px", fontWeight: 600 }}>{label}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>{d.processScore ?? "—"}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>{d.pl ?? "—"}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>{d.mentalAfter ?? "—"}</td>
                      <td style={{ padding: "6px 8px" }}>
                        <input
                          value={obs[key]}
                          onChange={e => setObs(prev => ({ ...prev, [key]: e.target.value }))}
                          onBlur={() => saveObs(key, obs[key])}
                          placeholder="najważniejsza obserwacja"
                          style={{
                            width: "100%",
                            border: "none",
                            borderBottom: "1px solid var(--color-border)",
                            background: "transparent",
                            fontSize: "var(--font-size-tiny)",
                            padding: "2px 0",
                          }}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </WeeklyLayout>
  )
}
