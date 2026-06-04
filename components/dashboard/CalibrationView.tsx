"use client"

import { useState, useTransition } from "react"
import { evaluateGoal } from "@/actions/calibration"

type Goal = {
  id: string
  layer: string
  sourceId: string | null
  goalText: string
  probabilityAssigned: number
  setAt: Date
  evaluatedAt: Date | null
  outcome: string | null
}

type Props = { goals: Goal[] }

// Calibration stats from evaluated goals
function computeStats(goals: Goal[]) {
  const evaluated = goals.filter((g) => g.outcome !== null)
  if (evaluated.length === 0) return null

  // Brier score: mean((p - outcome)^2), lower = better
  const brierScore =
    evaluated.reduce((sum, g) => {
      const p = g.probabilityAssigned / 100
      const o = g.outcome === "achieved" ? 1 : 0
      return sum + (p - o) ** 2
    }, 0) / evaluated.length

  // Bucket breakdown: group by 10% ranges
  const buckets: Record<string, { count: number; achieved: number }> = {}
  for (const g of evaluated) {
    const bucket = Math.floor(g.probabilityAssigned / 10) * 10
    const key = `${bucket}`
    if (!buckets[key]) buckets[key] = { count: 0, achieved: 0 }
    buckets[key].count++
    if (g.outcome === "achieved") buckets[key].achieved++
  }

  const bucketRows = Object.entries(buckets)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([key, { count, achieved }]) => ({
      range: `${key}–${parseInt(key) + 9}%`,
      predicted: parseInt(key) + 5, // midpoint
      actual: Math.round((achieved / count) * 100),
      count,
      achieved,
    }))

  return { brierScore, bucketRows, evaluatedCount: evaluated.length }
}

function formatDate(d: Date) {
  const date = new Date(d)
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
}

export function CalibrationView({ goals }: Props) {
  const pending = goals.filter((g) => g.outcome === null)
  const history = goals.filter((g) => g.outcome !== null)
  const stats = computeStats(goals)

  const [evaluating, setEvaluating] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [localOutcomes, setLocalOutcomes] = useState<Record<string, string>>({})

  function handleEvaluate(id: string, outcome: "achieved" | "not_achieved") {
    setEvaluating(id)
    setLocalOutcomes((prev) => ({ ...prev, [id]: outcome }))
    startTransition(async () => {
      await evaluateGoal(id, outcome)
      setEvaluating(null)
    })
  }

  const sectionHeader: React.CSSProperties = {
    background: "var(--color-mid)",
    color: "#fff",
    padding: "5px 12px 5px 16px",
    fontSize: "var(--font-size-tiny)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    borderRadius: 2,
    borderLeft: "4px solid var(--color-gold)",
    margin: "16px 0 10px",
  }

  return (
    <div>
      {/* Stats — only when ≥3 evaluated */}
      {stats && stats.evaluatedCount >= 3 && (
        <>
          <div style={{ ...sectionHeader, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Trafność kalibracji</span>
            <span style={{ position: "relative", display: "inline-block" }} className="cal-info-wrap">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.5)",
                  fontSize: 10,
                  cursor: "default",
                  flexShrink: 0,
                  color: "rgba(255,255,255,0.8)",
                }}
                title=""
              >
                i
              </span>
              <span
                className="cal-info-tooltip"
                style={{
                  display: "none",
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 6px)",
                  width: 280,
                  background: "var(--color-white)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                  padding: "8px 10px",
                  fontSize: 11,
                  color: "var(--color-text)",
                  lineHeight: 1.5,
                  zIndex: 50,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  textTransform: "none",
                  fontWeight: 400,
                  letterSpacing: 0,
                }}
              >
                <b>Kalibracja</b> mierzy, czy Twoje prawdopodobieństwa są trafne — czy gdy mówisz „70%", rzeczy naprawdę zdarzają się w ~70% przypadków.
                <br /><br />
                <b>Brier score</b> to średnia kwadratów błędu między prognozą a wynikiem (0 = ideał). Poniżej 0.15 to dobry wynik dla celów tygodniowych.
                <br /><br />
                <b>Tabela bucketów</b> pokazuje dla każdego przedziału prawdopodobieństwa: ile celów postawiłeś i ile faktycznie osiągnąłeś. Kolor kolumny „Realnie" oznacza, jak blisko byłeś prognozy (≤10pp zielony, ≤20pp złoty, &gt;20pp czerwony).
              </span>
            </span>
          </div>
          <style>{`.cal-info-wrap:hover .cal-info-tooltip { display: block !important; }`}</style>
          <div
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              padding: "10px 12px",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 24,
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: stats.brierScore < 0.15 ? "var(--color-green)" : stats.brierScore < 0.25 ? "var(--color-gold)" : "#D96060",
                  }}
                >
                  {stats.brierScore.toFixed(3)}
                </div>
                <div style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
                  Brier score (niższy = lepszy)
                </div>
                <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 2 }}>
                  &lt;0.15 dobry · &lt;0.25 ok · ≥0.25 słaby
                </div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)" }}>
                  {stats.evaluatedCount}
                </div>
                <div style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
                  Ocenionych celów
                </div>
              </div>
            </div>

            {stats.bucketRows.length > 0 && (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "var(--font-size-tiny)",
                }}
              >
                <thead>
                  <tr>
                    {["Przedział", "Cele", "Osiągnięte", "Prognoza", "Realnie"].map((h) => (
                      <th
                        key={h}
                        style={{
                          background: "var(--color-light)",
                          padding: "4px 8px",
                          textAlign: "center",
                          fontWeight: 600,
                          borderBottom: "1px solid var(--color-border)",
                          color: "var(--color-muted)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.bucketRows.map((row) => {
                    const diff = Math.abs(row.predicted - row.actual)
                    const diffColor = diff <= 10 ? "var(--color-green)" : diff <= 20 ? "var(--color-gold)" : "#D96060"
                    return (
                      <tr key={row.range}>
                        <td style={{ padding: "4px 8px", textAlign: "center", borderBottom: "0.5px solid var(--color-border)" }}>
                          {row.range}
                        </td>
                        <td style={{ padding: "4px 8px", textAlign: "center", borderBottom: "0.5px solid var(--color-border)" }}>
                          {row.count}
                        </td>
                        <td style={{ padding: "4px 8px", textAlign: "center", borderBottom: "0.5px solid var(--color-border)" }}>
                          {row.achieved}
                        </td>
                        <td style={{ padding: "4px 8px", textAlign: "center", borderBottom: "0.5px solid var(--color-border)", color: "var(--color-muted)" }}>
                          {row.predicted}%
                        </td>
                        <td style={{ padding: "4px 8px", textAlign: "center", borderBottom: "0.5px solid var(--color-border)", fontWeight: 600, color: diffColor }}>
                          {row.actual}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Pending */}
      <div style={sectionHeader}>Do oceny ({pending.length})</div>
      {pending.length === 0 ? (
        <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", padding: "8px 0" }}>
          Brak celów czekających na ocenę. Cele tworzone są automatycznie przy zakończeniu przeglądu tygodniowego.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pending.map((g) => {
            const localOutcome = localOutcomes[g.id]
            const isDone = !!localOutcome
            return (
              <div
                key={g.id}
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                  padding: "10px 12px",
                  opacity: isDone ? 0.5 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "var(--font-size-tiny)",
                        color: "var(--color-muted)",
                        marginBottom: 4,
                      }}
                    >
                      Tydzień od {g.sourceId ?? formatDate(g.setAt)} ·{" "}
                      <span
                        style={{
                          fontWeight: 700,
                          color: "var(--color-gold)",
                        }}
                      >
                        {g.probabilityAssigned}%
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "var(--font-size-body)",
                        color: "var(--color-text)",
                      }}
                    >
                      {g.goalText}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      disabled={evaluating === g.id}
                      onClick={() => handleEvaluate(g.id, "achieved")}
                      style={{
                        padding: "4px 10px",
                        fontSize: "var(--font-size-tiny)",
                        fontWeight: 700,
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                        background: localOutcome === "achieved" ? "#2D8C4E" : "var(--color-light)",
                        color: localOutcome === "achieved" ? "#fff" : "var(--color-text)",
                        borderLeft: localOutcome === "achieved" ? "3px solid #2D8C4E" : "3px solid var(--color-border)",
                      }}
                    >
                      ✓ Tak
                    </button>
                    <button
                      disabled={evaluating === g.id}
                      onClick={() => handleEvaluate(g.id, "not_achieved")}
                      style={{
                        padding: "4px 10px",
                        fontSize: "var(--font-size-tiny)",
                        fontWeight: 700,
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                        background: localOutcome === "not_achieved" ? "#D96060" : "var(--color-light)",
                        color: localOutcome === "not_achieved" ? "#fff" : "var(--color-text)",
                        borderLeft: localOutcome === "not_achieved" ? "3px solid #D96060" : "3px solid var(--color-border)",
                      }}
                    >
                      ✗ Nie
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <>
          <div style={sectionHeader}>Historia</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((g) => {
              const achieved = g.outcome === "achieved"
              return (
                <div
                  key={g.id}
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: 4,
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    borderLeft: `3px solid ${achieved ? "#2D8C4E" : "#D96060"}`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--color-muted)",
                        marginBottom: 2,
                      }}
                    >
                      {g.sourceId ?? formatDate(g.setAt)} · {g.probabilityAssigned}% ·{" "}
                      oceniono {g.evaluatedAt ? formatDate(g.evaluatedAt) : ""}
                    </div>
                    <div style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text)" }}>
                      {g.goalText}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "var(--font-size-tiny)",
                      fontWeight: 700,
                      color: achieved ? "#2D8C4E" : "#D96060",
                      flexShrink: 0,
                    }}
                  >
                    {achieved ? "✓ Tak" : "✗ Nie"}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
