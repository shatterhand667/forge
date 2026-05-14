"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, TextArea } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

export function WeeklyStep9Bridge({ review, weekStart, step }: Props) {
  const router = useRouter()
  const [topic, setTopic] = useState(review.bridgeStrategicTopic ?? "")
  const rawItems = Array.isArray(review.bridgePreMortemItems)
    ? review.bridgePreMortemItems as string[]
    : ["", "", ""]
  const [items, setItems] = useState<string[]>([
    rawItems[0] ?? "",
    rawItems[1] ?? "",
    rawItems[2] ?? "",
  ])
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateWeeklyReview(review.id, {
      bridgeStrategicTopic: topic || undefined,
      bridgePreMortemItems: items,
    })
    router.push(`/weekly/${weekStart}/step/10`)
  }

  return (
    <WeeklyLayout
      weekStart={weekStart}
      currentStep={step}
      totalSteps={11}
      stepLabel="Most do Daily (Bridge 2)"
      prevHref={`/weekly/${weekStart}/step/8`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}
    >
      <div className="flex flex-col gap-6">
        <SectionHeader number="14" title="MOST DO DAILY — CO PRZENOSZĘ DO NASTĘPNEGO TYGODNIA" />

        <div
          style={{
            padding: "8px 12px",
            borderLeft: "3px solid var(--color-gold)",
            background: "var(--color-light)",
            fontSize: "var(--font-size-tiny)",
            color: "var(--color-muted)",
          }}
        >
          Bridge 2: temat strategiczny pojawi się w nagłówku Daily Card przez cały następny tydzień. Konkrety trafią do pre-mortem każdego ranka.
        </div>

        <TextArea
          label="Jeden temat do pogłębienia (strategiczny focus tygodnia):"
          value={topic}
          onChange={setTopic}
          rows={2}
        />

        <div>
          <p
            style={{
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-muted)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            Konkrety do pre-mortem w każdej Daily Card (2-3 błędy/wzorce z sekcji 10):
          </p>
          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span
                  style={{
                    fontSize: "var(--font-size-tiny)",
                    color: "var(--color-muted)",
                    minWidth: 16,
                    paddingTop: 4,
                  }}
                >
                  {i + 1}.
                </span>
                <input
                  value={item}
                  onChange={e => setItems(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
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
      </div>

      <div className="sticky bottom-0 border-t" style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}>
        <div className="mx-auto px-4 py-3 flex justify-between" style={{ maxWidth: "var(--content-max-width)" }}>
          <a href={`/weekly/${weekStart}/step/8`} style={{ color: "var(--color-muted)", fontSize: 14 }}>← Wstecz</a>
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
