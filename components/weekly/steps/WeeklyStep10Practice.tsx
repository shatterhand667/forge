"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, BridgeIndicator } from "@/components/forge"
import { AutoTextarea } from "@/components/forge/TableInput"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"
import type { Prisma } from "@prisma/client"

interface PracticeRow { priority: string; task: string; when: string; howMeasure: string }
interface PrevPlan { practicePlan: unknown; weekStart: Date }
interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number; prevPracticePlan?: PrevPlan | null }

function parsePlan(raw: unknown): PracticeRow[] {
  const empty: PracticeRow = { priority: "", task: "", when: "", howMeasure: "" }
  if (!Array.isArray(raw)) return [empty, empty, empty]
  const rows = (raw as Partial<PracticeRow>[]).map(r => ({
    priority: r.priority ?? "",
    task: r.task ?? "",
    when: r.when ?? "",
    howMeasure: r.howMeasure ?? "",
  }))
  while (rows.length < 3) rows.push({ ...empty })
  return rows.slice(0, 3)
}

function parseScores(raw: unknown, count: number): number[] {
  if (Array.isArray(raw)) {
    const scores = (raw as unknown[]).map(v => (typeof v === "number" ? v : 0))
    while (scores.length < count) scores.push(0)
    return scores.slice(0, count)
  }
  return Array(count).fill(0)
}

const DOT_COLORS: Record<number, string> = {
  1: "#CC3333",
  2: "#E07B2A",
  3: "#3D9B47",
}

function ScoreDots({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {[1, 2, 3].map(n => {
        const filled = value >= n
        const color = filled ? DOT_COLORS[value] : "#CCCCCC"
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              border: `1.5px solid ${filled ? color : "#CCCCCC"}`,
              background: filled ? color : "transparent",
              cursor: "pointer",
              padding: 0,
              transition: "all 150ms ease",
            }}
            aria-label={`Ocena ${n}`}
          />
        )
      })}
    </div>
  )
}

const PRIORITIES = ["", "MUST", "SHOULD"]

export function WeeklyStep10Practice({ review, weekStart, step, prevPracticePlan }: Props) {
  const prevRows = parsePlan(prevPracticePlan?.practicePlan).filter(r => r.task)
  const prevLabel = prevPracticePlan
    ? (() => { const d = new Date(prevPracticePlan.weekStart); return `${d.getUTCDate()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}` })()
    : null

  const router = useRouter()
  const [scores, setScores] = useState<number[]>(() => parseScores(review.lastWeekPracticeScores, prevRows.length))
  const [whatWentWrong, setWhatWentWrong] = useState(review.lastWeekPracticeWhatWentWrong ?? "")
  const [plan, setPlan] = useState<PracticeRow[]>(() => parsePlan(review.practicePlan))
  const [meta, setMeta] = useState(review.practiceMeta ?? "")
  const [saving, setSaving] = useState(false)

  function updateScore(i: number, v: number) {
    setScores(prev => prev.map((s, idx) => idx === i ? v : s))
  }

  function updateRow(i: number, field: keyof PracticeRow, value: string) {
    setPlan(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  async function handleNext() {
    setSaving(true)
    await updateWeeklyReview(review.id, {
      lastWeekPracticeScores: scores as unknown as Prisma.InputJsonValue,
      lastWeekPracticeWhatWentWrong: whatWentWrong || undefined,
      practicePlan: plan as unknown as Prisma.InputJsonValue,
      practiceMeta: meta || undefined,
    })
    router.push(`/weekly/${weekStart}/step/11`)
  }

  return (
    <WeeklyLayout
      weekStart={weekStart}
      currentStep={step}
      totalSteps={11}
      stepLabel="Deliberate practice"
      prevHref={`/weekly/${weekStart}/step/9`}
      onNext={handleNext}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : "Dalej →"}
      lastWeekGoalRecap={review.lastWeekGoalRecap}
    >
      <div className="flex flex-col gap-6">
        <SectionHeader number="15" title="DELIBERATE PRACTICE — ROZLICZENIE + PLAN" />

        {prevLabel && prevRows.length > 0 && (
          <div className="flex flex-col gap-2">
            <BridgeIndicator source={`plan z tygodnia ${prevLabel}`} />
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--font-size-tiny)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)", width: "10%" }}>Priorytet</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)", textAlign: "left" }}>Zadanie</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)", width: "18%", textAlign: "left" }}>Kiedy?</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)", width: "22%", textAlign: "left" }}>Jak zmierzę?</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)", width: "60px", textAlign: "center" }}>Ocena</th>
                </tr>
              </thead>
              <tbody>
                {prevRows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: row.priority === "MUST" ? "var(--color-gold)" : "var(--color-muted)" }}>
                      {row.priority || "—"}
                    </td>
                    <td style={{ padding: "6px 8px" }}>{row.task}</td>
                    <td style={{ padding: "6px 8px", color: "var(--color-muted)" }}>{row.when}</td>
                    <td style={{ padding: "6px 8px", color: "var(--color-muted)" }}>{row.howMeasure}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>
                      <ScoreDots value={scores[i] ?? 0} onChange={v => updateScore(i, v)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div>
              <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
                Co poszło nie tak?
              </span>
              <AutoTextarea
                value={whatWentWrong}
                onChange={v => setWhatWentWrong(v)}
                style={{
                  display: "block",
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid var(--color-border)",
                  background: "transparent",
                  fontSize: "var(--font-size-tiny)",
                  padding: "4px 0",
                  marginTop: 4,
                  color: "var(--color-text)",
                  resize: "none",
                }}
              />
            </div>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--font-size-tiny)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", width: "12%" }}>Priorytet</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", width: "40%", textAlign: "left" }}>Zadanie</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", width: "20%", textAlign: "left" }}>Kiedy?</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", width: "28%", textAlign: "left" }}>Jak zmierzę?</th>
              </tr>
            </thead>
            <tbody>
              {plan.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    <select
                      value={row.priority}
                      onChange={e => updateRow(i, "priority", e.target.value)}
                      style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: 4,
                        padding: "2px 4px",
                        fontSize: "var(--font-size-tiny)",
                        background: row.priority === "MUST" ? "var(--color-gold)" : "transparent",
                        color: row.priority === "MUST" ? "var(--color-white)" : "var(--color-text)",
                      }}
                    >
                      {PRIORITIES.map(p => <option key={p} value={p}>{p || "—"}</option>)}
                    </select>
                  </td>
                  {(["task", "when", "howMeasure"] as const).map(field => (
                    <td key={field} style={{ padding: "6px 8px" }}>
                      <input
                        value={row[field]}
                        onChange={e => updateRow(i, field, e.target.value)}
                        style={{
                          width: "100%",
                          border: "none",
                          borderBottom: "1px solid var(--color-border)",
                          background: "transparent",
                          fontSize: "var(--font-size-tiny)",
                          padding: "2px 0",
                          color: "var(--color-text)",
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
            META: czy zaplanowane zadania (poprz. tydzień) były właściwe? Co powinienem był zrobić zamiast?
          </span>
          <input
            value={meta}
            onChange={e => setMeta(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              border: "none",
              borderBottom: "1px solid var(--color-border)",
              background: "transparent",
              fontSize: "var(--font-size-tiny)",
              padding: "4px 0",
              marginTop: 4,
              color: "var(--color-text)",
            }}
          />
        </div>
      </div>
    </WeeklyLayout>
  )
}
