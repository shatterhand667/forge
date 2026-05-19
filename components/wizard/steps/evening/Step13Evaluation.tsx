"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, GoldCircles, TextInput } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import { upsertDailyOutcome } from "@/actions/calibration"
import type { DailyCard } from "@prisma/client"

type WeeklyGoal = {
  id: string
  goalText: string
  dailyOutcomes: unknown
  outcomeScore: number | null
}

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: any[] }
  date: string
  step: number
  weeklyGoal?: WeeklyGoal | null
}

export function Step13Evaluation({ card, date, step, weeklyGoal }: Props) {
  const router = useRouter()
  const [processScore, setProcessScore] = useState<number | null>(card.processScore)
  const [pl, setPl] = useState(card.pl ?? "")
  const [maxDailyDrawdown, setMaxDailyDrawdown] = useState(card.maxDailyDrawdown ?? "")
  const [dailyMaxRisk, setDailyMaxRisk] = useState(card.dailyMaxRisk ?? "")
  const [overallScore, setOverallScore] = useState<number | null>(card.overallScore)
  const [saving, setSaving] = useState(false)

  const existingDailyOutcome = weeklyGoal
    ? (Array.isArray(weeklyGoal.dailyOutcomes)
        ? (weeklyGoal.dailyOutcomes as { date: string; achieved: boolean }[])
        : []
      ).find((d) => d.date === date)?.achieved ?? null
    : null
  const [dailyAchieved, setDailyAchieved] = useState<boolean | null>(existingDailyOutcome)

  async function handleDailyOutcome(achieved: boolean) {
    setDailyAchieved(achieved)
    if (weeklyGoal) await upsertDailyOutcome(weeklyGoal.id, date, achieved)
  }

  async function handleNext() {
    setSaving(true)
    await updateDailyCard(card.id, {
      processScore: processScore ?? undefined,
      pl,
      maxDailyDrawdown,
      dailyMaxRisk,
      overallScore: overallScore ?? undefined,
    })
    router.push(`/cards/${date}/evening/14`)
  }

  return (
    <WizardLayout
      date={date}
      session="evening"
      currentStep={step}
      totalSteps={15}
      stepLabel="Ocena dzienna"
      prevHref={`/cards/${date}/evening/12`}
      onNext={handleNext}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : "Dalej →"}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="12" title="OCENA DZIENNA" />

        {weeklyGoal && (
          <div style={{ padding: "8px 12px", background: "var(--color-light)", borderLeft: "3px solid var(--color-gold)", borderRadius: 2 }}>
            <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 6 }}>
              Cel tygodniowy — czy dziś zrealizowałeś?
            </p>
            <div className="flex items-center justify-between gap-4">
              <p style={{ fontSize: "var(--font-size-body)", color: "var(--color-text)", flex: 1 }}>
                {weeklyGoal.goalText}
              </p>
              <div className="flex gap-2 shrink-0">
                {([true, false] as const).map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => handleDailyOutcome(val)}
                    style={{
                      fontSize: "var(--font-size-tiny)", padding: "3px 12px", borderRadius: 4,
                      border: `1px solid ${val ? "#2D6A4F" : "#D96060"}`,
                      background: dailyAchieved === val ? (val ? "#2D6A4F" : "#D96060") : "var(--color-white)",
                      color: dailyAchieved === val ? "#fff" : "var(--color-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {val ? "Tak" : "Nie"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 py-2">
          {/* Process score 1-10 */}
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--color-muted)", fontSize: "var(--font-size-label)", minWidth: 140 }}>
              Process score (1–10):
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setProcessScore(n)}
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: 20,
                    height: 20,
                    border: `0.8px solid var(--color-accent)`,
                    background: processScore === n ? "var(--color-accent)" : "var(--color-white)",
                    color: processScore === n ? "var(--color-white)" : "var(--color-muted)",
                    fontSize: 8,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <TextInput label="P&L:" value={pl} onChange={setPl} placeholder="np. +1.5R lub -250 PLN" />
          <TextInput label="Największy drawdown:" value={maxDailyDrawdown} onChange={setMaxDailyDrawdown} placeholder="np. –2.5R lub –1.8%" />
          <TextInput label="Max ryzyko na trade:" value={dailyMaxRisk} onChange={setDailyMaxRisk} placeholder="np. 1.0R lub 0.5%" />
          <GoldCircles label="Ogólna ocena (1–10):" value={overallScore} onChange={setOverallScore} options={[1,2,3,4,5,6,7,8,9,10]} />
        </div>
      </div>

    </WizardLayout>
  )
}
