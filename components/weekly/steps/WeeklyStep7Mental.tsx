"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, TextArea, BridgeIndicator } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

const DAYS_SHORT = ["Pon", "Wt", "Śr", "Czw", "Pt"]

function DotScore({ value }: { value: number | null }) {
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map(n => (
        <div
          key={n}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: value !== null && n <= value ? "var(--color-gold)" : "var(--color-border)",
          }}
        />
      ))}
    </div>
  )
}

export function WeeklyStep7Mental({ review, stats, weekStart, step }: Props) {
  const router = useRouter()
  const [renewed, setRenewed] = useState(review.renewedMe ?? "")
  const [drained, setDrained] = useState(review.drainedMe ?? "")
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateWeeklyReview(review.id, {
      renewedMe: renewed || undefined,
      drainedMe: drained || undefined,
    })
    router.push(`/weekly/${weekStart}/step/8`)
  }

  return (
    <WeeklyLayout
      weekStart={weekStart}
      currentStep={step}
      totalSteps={11}
      stepLabel="Mental capital"
      prevHref={`/weekly/${weekStart}/step/6`}
      onNext={handleNext}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : "Dalej →"}
      lastWeekGoalRecap={review.lastWeekGoalRecap}
    >
      <div className="flex flex-col gap-6">
        <SectionHeader number="11" title="MENTAL CAPITAL — ODNAWIANIE VS WYCZERPYWANIE" />

        <div>
          <BridgeIndicator source="z kart dziennych" />
          <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", marginBottom: 8 }}>
            Stan dzień po dniu (mental state wieczorem):
          </p>
          <div className="flex gap-4">
            {DAYS_SHORT.map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-1">
                <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>{day}</span>
                <DotScore value={stats.mentalPerDay[i]} />
                <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text)" }}>
                  {stats.mentalPerDay[i] ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <div style={{ flex: 1 }}>
            <TextArea
              label="ODNAWIAŁO mnie (rituals of renewal):"
              value={renewed}
              onChange={setRenewed}
              rows={4}
            />
          </div>
          <div style={{ flex: 1 }}>
            <TextArea
              label="WYCZERPYWAŁO mnie:"
              value={drained}
              onChange={setDrained}
              rows={4}
            />
          </div>
        </div>
      </div>

    </WeeklyLayout>
  )
}
