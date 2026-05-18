"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, GoldCircles, TextInput } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import type { DailyCard } from "@prisma/client"

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: any[] }
  date: string
  step: number
}

export function Step13Evaluation({ card, date, step }: Props) {
  const router = useRouter()
  const [processScore, setProcessScore] = useState<number | null>(card.processScore)
  const [pl, setPl] = useState(card.pl ?? "")
  const [overallScore, setOverallScore] = useState<number | null>(card.overallScore)
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateDailyCard(card.id, {
      processScore: processScore ?? undefined,
      pl,
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
          <GoldCircles label="Ogólna ocena (1–10):" value={overallScore} onChange={setOverallScore} options={[1,2,3,4,5,6,7,8,9,10]} />
        </div>
      </div>

    </WizardLayout>
  )
}
