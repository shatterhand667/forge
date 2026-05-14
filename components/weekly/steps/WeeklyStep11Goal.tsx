"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

export function WeeklyStep11Goal({ review, weekStart, step }: Props) {
  const router = useRouter()
  const [oneSentence, setOneSentence] = useState(review.oneSentenceSummary ?? "")
  const [mentor, setMentor] = useState(review.mentorTopic ?? "")
  const [stopLoss, setStopLoss] = useState(review.stopLossThreshold ?? "")
  const [systemCheck, setSystemCheck] = useState(review.systemCheck ?? "")
  const [goal, setGoal] = useState(review.processGoalNextWeek ?? "")
  const [probability, setProbability] = useState<string>(
    review.processGoalProbability?.toString() ?? ""
  )
  const [saving, setSaving] = useState(false)

  async function handleFinish() {
    setSaving(true)
    const p = parseInt(probability)
    await updateWeeklyReview(review.id, {
      oneSentenceSummary: oneSentence || undefined,
      mentorTopic: mentor || undefined,
      stopLossThreshold: stopLoss || undefined,
      systemCheck: systemCheck || undefined,
      processGoalNextWeek: goal || undefined,
      processGoalProbability: isNaN(p) ? undefined : p,
      status: "COMPLETED",
    })
    router.push(`/weekly/${weekStart}/complete`)
  }

  const fields = [
    {
      label: "Jedno zdanie podsumowujące ten tydzień:",
      value: oneSentence,
      set: setOneSentence,
    },
    {
      label: "Top 1 rzecz do omówienia z mentorem / podem:",
      value: mentor,
      set: setMentor,
    },
    {
      label: "Mój próg automatycznego stopu (mental state X przez Y dni / strata Z R):",
      value: stopLoss,
      set: setStopLoss,
    },
    {
      label: "System check: czy moje narzędzia jeszcze pracują, czy stały się rytuałem? Co zmienić?",
      value: systemCheck,
      set: setSystemCheck,
    },
  ]

  return (
    <WeeklyLayout
      weekStart={weekStart}
      currentStep={step}
      totalSteps={11}
      stepLabel="Cel + Mentor + Stop-loss"
      prevHref={`/weekly/${weekStart}/step/10`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="16" title="MENTOR · STOP-LOSS · SYSTEM CHECK · CEL" />

        {fields.map(({ label, value, set }) => (
          <div key={label}>
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>{label}</span>
            <input
              value={value}
              onChange={e => set(e.target.value)}
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
        ))}

        <div>
          <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
            Cel procesowy na przyszły tydzień (mierzalny, sprawdzalny za 7 dni):
          </span>
          <input
            value={goal}
            onChange={e => setGoal(e.target.value)}
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
          <div className="flex gap-2 items-center mt-2">
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
              Prawdopodobieństwo realizacji:
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={probability}
              onChange={e => setProbability(e.target.value)}
              style={{
                width: 60,
                border: "1px solid var(--color-border)",
                borderRadius: 4,
                padding: "2px 6px",
                fontSize: "var(--font-size-tiny)",
                color: "var(--color-text)",
              }}
            />
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>%</span>
          </div>
        </div>
      </div>

      <div
        className="sticky bottom-0 border-t"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div
          className="mx-auto px-4 py-3 flex justify-between"
          style={{ maxWidth: "var(--content-max-width)" }}
        >
          <a href={`/weekly/${weekStart}/step/10`} style={{ color: "var(--color-muted)", fontSize: 14 }}>
            ← Wstecz
          </a>
          <button
            onClick={handleFinish}
            disabled={saving}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ background: "var(--color-mid)", color: "var(--color-white)" }}
          >
            {saving ? "Zapisuję..." : "Zakończ przegląd →"}
          </button>
        </div>
      </div>
    </WeeklyLayout>
  )
}
