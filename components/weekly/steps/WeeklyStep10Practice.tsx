"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"
import type { Prisma } from "@prisma/client"

interface PracticeRow { priority: string; task: string; when: string; howMeasure: string }
interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

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

const PRIORITIES = ["", "MUST", "SHOULD"]

export function WeeklyStep10Practice({ review, weekStart, step }: Props) {
  const router = useRouter()
  const [count, setCount] = useState<string>(review.lastWeekPracticeCount?.toString() ?? "")
  const [whatWentWrong, setWhatWentWrong] = useState(review.lastWeekPracticeWhatWentWrong ?? "")
  const [plan, setPlan] = useState<PracticeRow[]>(() => parsePlan(review.practicePlan))
  const [meta, setMeta] = useState(review.practiceMeta ?? "")
  const [saving, setSaving] = useState(false)

  function updateRow(i: number, field: keyof PracticeRow, value: string) {
    setPlan(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  async function handleNext() {
    setSaving(true)
    const c = parseInt(count)
    await updateWeeklyReview(review.id, {
      lastWeekPracticeCount: isNaN(c) ? undefined : c,
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

        <div className="flex flex-col gap-3">
          <div className="flex gap-2 items-center flex-wrap">
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
              Plan z poprzedniego tygodnia: zrealizowano
            </span>
            <select
              value={count}
              onChange={e => setCount(e.target.value)}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: 4,
                padding: "2px 4px",
                fontSize: "var(--font-size-tiny)",
              }}
            >
              <option value="">—</option>
              {[0, 1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>z 3 zadań.</span>
          </div>
          <div>
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
              Co poszło nie tak?
            </span>
            <input
              value={whatWentWrong}
              onChange={e => setWhatWentWrong(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                border: "none",
                borderBottom: "1px solid var(--color-border)",
                background: "transparent",
                fontSize: "var(--font-size-body)",
                padding: "4px 0",
                marginTop: 4,
                color: "var(--color-text)",
              }}
            />
          </div>
        </div>

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
              fontSize: "var(--font-size-body)",
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
