"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, TextArea } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

export function WeeklyStep5Lessons({ review, weekStart, step }: Props) {
  const router = useRouter()
  const [l1, setL1] = useState(review.lesson1 ?? "")
  const [l2, setL2] = useState(review.lesson2 ?? "")
  const [l3, setL3] = useState(review.lesson3 ?? "")
  const [gratitude, setGratitude] = useState(review.gratitude ?? "")
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateWeeklyReview(review.id, {
      lesson1: l1 || undefined,
      lesson2: l2 || undefined,
      lesson3: l3 || undefined,
      gratitude: gratitude || undefined,
    })
    router.push(`/weekly/${weekStart}/step/6`)
  }

  const lessons = [
    { n: 1, val: l1, set: setL1 },
    { n: 2, val: l2, set: setL2 },
    { n: 3, val: l3, set: setL3 },
  ]

  return (
    <WeeklyLayout
      weekStart={weekStart}
      currentStep={step}
      totalSteps={11}
      stepLabel="Trzy lekcje + wdzięczność"
      prevHref={`/weekly/${weekStart}/step/4`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}
    >
      <div className="flex flex-col gap-6">
        <div>
          <SectionHeader number="7" title="TRZY KONKRETNE LEKCJE Z TYGODNIA" />
          <p
            style={{
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-muted)",
              marginBottom: 12,
              fontStyle: "italic",
            }}
          >
            Nie ogólniki. Konkretne, transferowalne wnioski które zabierasz w przyszły tydzień:
          </p>
          <div className="flex flex-col gap-3">
            {lessons.map(({ n, val, set }) => (
              <div key={n} className="flex gap-2 items-start">
                <span
                  style={{
                    fontSize: "var(--font-size-tiny)",
                    color: "var(--color-muted)",
                    minWidth: 16,
                    paddingTop: 4,
                  }}
                >
                  {n}.
                </span>
                <input
                  value={val}
                  onChange={e => set(e.target.value)}
                  style={{
                    flex: 1,
                    border: "none",
                    borderBottom: "1px solid var(--color-border)",
                    background: "transparent",
                    fontSize: "var(--font-size-body)",
                    padding: "4px 0",
                    color: "var(--color-text)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader number="8" title="WDZIĘCZNOŚĆ — POZYTYWNY ANCHOR TYGODNIA" />
          <TextArea
            label="Za co jestem wdzięczny w tym tygodniu (osobiste, niekoniecznie tradingowe):"
            value={gratitude}
            onChange={setGratitude}
            rows={3}
          />
        </div>
      </div>

      <div className="sticky bottom-0 border-t" style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}>
        <div className="mx-auto px-4 py-3 flex justify-between" style={{ maxWidth: "var(--content-max-width)" }}>
          <a href={`/weekly/${weekStart}/step/4`} style={{ color: "var(--color-muted)", fontSize: 14 }}>← Wstecz</a>
          <button
            onClick={handleNext}
            disabled={saving}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ background: "var(--color-mid)", color: "var(--color-white)" }}
          >
            {saving ? "Zapisuję..." : "Dalej →"}
          </button>
        </div>
      </div>
    </WeeklyLayout>
  )
}
