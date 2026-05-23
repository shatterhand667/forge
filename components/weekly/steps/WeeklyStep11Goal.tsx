"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader } from "@/components/forge"
import { AutoTextarea } from "@/components/forge/TableInput"
import { updateWeeklyReview } from "@/actions/weekly"
import { upsertCalibrationGoal } from "@/actions/calibration"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

type PrevGoal = { goalText: string; probabilityAssigned: number; outcomeScore: number | null } | null

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number; prevWeekGoal?: PrevGoal }

export function WeeklyStep11Goal({ review, weekStart, step, prevWeekGoal }: Props) {
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
    if (goal && !isNaN(p)) {
      await upsertCalibrationGoal(weekStart, goal, p)
    }
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
      onNext={handleFinish}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : "Zakończ przegląd →"}
      lastWeekGoalRecap={review.lastWeekGoalRecap}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="16" title="MENTOR · STOP-LOSS · SYSTEM CHECK · CEL" />

        {prevWeekGoal && (
          <div style={{ padding: "8px 12px", background: "var(--color-light)", borderLeft: "3px solid var(--color-gold)", borderRadius: 2, fontSize: "var(--font-size-tiny)" }}>
            <span style={{ color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
              Poprzedni cel:
            </span>
            <span style={{ color: "var(--color-text)", marginLeft: 8 }}>{prevWeekGoal.goalText}</span>
            <span style={{ color: "var(--color-muted)", marginLeft: 8 }}>({prevWeekGoal.probabilityAssigned}%)</span>
            {prevWeekGoal.outcomeScore !== null && (
              <span style={{
                marginLeft: 10, padding: "1px 8px", borderRadius: 3,
                background: prevWeekGoal.outcomeScore >= 0.5 ? "#2D6A4F" : "#D96060",
                color: "#fff", fontWeight: 700,
              }}>
                {Math.round(prevWeekGoal.outcomeScore * 100)}%
              </span>
            )}
          </div>
        )}

        {fields.map(({ label, value, set }) => (
          <div key={label}>
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>{label}</span>
            <AutoTextarea
              value={value}
              onChange={set}
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
        ))}

        <div>
          <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
            Cel procesowy na przyszły tydzień (mierzalny, sprawdzalny za 7 dni):
          </span>
          <AutoTextarea
            value={goal}
            onChange={setGoal}
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

    </WeeklyLayout>
  )
}
