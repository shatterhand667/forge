"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, TextArea } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

export function WeeklyStep4Trades({ review, weekStart, step }: Props) {
  const router = useRouter()
  const [best, setBest] = useState(review.bestTradeWhy ?? "")
  const [worst, setWorst] = useState(review.worstTradeWhatWentWrong ?? "")
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateWeeklyReview(review.id, {
      bestTradeWhy: best || undefined,
      worstTradeWhatWentWrong: worst || undefined,
    })
    router.push(`/weekly/${weekStart}/step/5`)
  }

  return (
    <WeeklyLayout
      weekStart={weekStart}
      currentStep={step}
      totalSteps={11}
      stepLabel="Najlepszy i najgorszy trade"
      prevHref={`/weekly/${weekStart}/step/3`}
      onNext={handleNext}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : "Dalej →"}
      lastWeekGoalRecap={review.lastWeekGoalRecap}
    >
      <div className="flex flex-col gap-6">
        <div>
          <SectionHeader number="5" title="NAJLEPSZY TRADE TYGODNIA — DLACZEGO ZADZIAŁAŁ?" />
          <TextArea
            label="Powodzenie nie dlatego, że zarobił — ale dlatego, że zachowałem się zgodnie z planem. Co konkretnie?"
            value={best}
            onChange={setBest}
            rows={6}
          />
        </div>
        <div>
          <SectionHeader number="6" title="NAJGORSZY TRADE TYGODNIA — CO POSZŁO NIE TAK?" />
          <TextArea
            label="Nie chodzi o stratę. Chodzi o decyzję. Co dokładnie zrobiłem źle — i co czułem, zanim to zrobiłem?"
            value={worst}
            onChange={setWorst}
            rows={6}
          />
        </div>
      </div>
    </WeeklyLayout>
  )
}
