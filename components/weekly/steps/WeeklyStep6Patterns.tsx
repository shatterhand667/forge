"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, TextArea, TableInput } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface ErrorRow {
  id: string
  error: string
  count: string
  triggerContext: string
  costR: string
  eliminationPlan: string
}

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

const ERROR_COLUMNS = [
  { id: "error",           label: "Błąd",              width: "26%", type: "textarea" as const },
  { id: "count",           label: "Ile razy",           width: "8%",  type: "number" as const },
  { id: "triggerContext",  label: "Trigger / kontekst", width: "28%", type: "textarea" as const },
  { id: "costR",           label: "Koszt (R)",          width: "10%", type: "number" as const },
  { id: "eliminationPlan", label: "Plan eliminacji",    width: "28%", type: "textarea" as const },
]

function makeEmpty(): ErrorRow {
  return { id: crypto.randomUUID(), error: "", count: "", triggerContext: "", costR: "", eliminationPlan: "" }
}

function parseRows(raw: unknown): ErrorRow[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [makeEmpty(), makeEmpty(), makeEmpty(), makeEmpty()]
  }
  return (raw as Array<Partial<ErrorRow>>).map(r => ({
    id: crypto.randomUUID(),
    error: r.error ?? "",
    count: r.count ?? "",
    triggerContext: r.triggerContext ?? "",
    costR: r.costR ?? "",
    eliminationPlan: r.eliminationPlan ?? "",
  }))
}

export function WeeklyStep6Patterns({ review, weekStart, step }: Props) {
  const router = useRouter()
  const [pattern, setPattern] = useState(review.patternWhenStrongest ?? "")
  const [rows, setRows] = useState<Record<string, unknown>[]>(
    () => parseRows(review.repeatingErrors) as unknown as Record<string, unknown>[]
  )
  const [saving, setSaving] = useState(false)

  async function saveErrors(updatedRows: Record<string, unknown>[]) {
    const data = updatedRows.map(({ id: _id, ...rest }) => rest) as import("@prisma/client").Prisma.InputJsonValue
    await updateWeeklyReview(review.id, { repeatingErrors: data })
  }

  function handleAddRow() {
    const newRows = [...rows, makeEmpty() as unknown as Record<string, unknown>]
    setRows(newRows)
    saveErrors(newRows)
  }

  function handleUpdateRow(index: number, field: string, value: string | number) {
    const newRows = rows.map((r, i) => i === index ? { ...r, [field]: String(value) } : r)
    setRows(newRows)
    saveErrors(newRows)
  }

  async function handleNext() {
    setSaving(true)
    await updateWeeklyReview(review.id, { patternWhenStrongest: pattern || undefined })
    router.push(`/weekly/${weekStart}/step/7`)
  }

  return (
    <WeeklyLayout
      weekStart={weekStart}
      currentStep={step}
      totalSteps={11}
      stepLabel="Wzorce + powtarzające się błędy"
      prevHref={`/weekly/${weekStart}/step/5`}
      onNext={handleNext}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : "Dalej →"}
      lastWeekGoalRecap={review.lastWeekGoalRecap}
    >
      <div className="flex flex-col gap-6">
        <div>
          <SectionHeader number="9" title="PATTERN ANALYSIS — KIEDY MÓJ EDGE JEST NAJMOCNIEJSZY?" />
          <TextArea
            label="Spójrz na wszystkie wygrywające trade'y. Co je łączy? (rynek, godzina, setup, kontekst makro, mój stan)"
            value={pattern}
            onChange={setPattern}
            rows={4}
          />
        </div>

        <div>
          <SectionHeader number="10" title="POWTARZAJĄCE SIĘ BŁĘDY (≥2 RAZY W TYM TYGODNIU)" />
          <TableInput
            columns={ERROR_COLUMNS}
            rows={rows}
            onAddRow={handleAddRow}
            onUpdateRow={handleUpdateRow}
            addLabel="+ Dodaj błąd"
            emptyRows={0}
          />
        </div>
      </div>
    </WeeklyLayout>
  )
}
