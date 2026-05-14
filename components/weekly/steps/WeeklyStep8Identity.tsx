"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, TextArea } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

export function WeeklyStep8Identity({ review, weekStart, step }: Props) {
  const router = useRouter()
  const [was, setWas] = useState(review.identityWasThatTrader ?? "")
  const [wasNot, setWasNot] = useState(review.identityWasNot ?? "")
  const [threats, setThreats] = useState(review.threatsMap ?? "")
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateWeeklyReview(review.id, {
      identityWasThatTrader: was || undefined,
      identityWasNot: wasNot || undefined,
      threatsMap: threats || undefined,
    })
    router.push(`/weekly/${weekStart}/step/9`)
  }

  return (
    <WeeklyLayout
      weekStart={weekStart}
      currentStep={step}
      totalSteps={11}
      stepLabel="Identity + mapa zagrożeń"
      prevHref={`/weekly/${weekStart}/step/7`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}
    >
      <div className="flex flex-col gap-6">
        <div>
          <SectionHeader number="12" title="IDENTITY CHECK" />
          <div className="flex flex-col gap-4">
            <TextArea
              label="Konkretne sytuacje, w których ZACHOWAŁEM SIĘ jak ten trader:"
              value={was}
              onChange={setWas}
              rows={3}
            />
            <TextArea
              label="Sytuacje, w których NIE zachowałem się jak ten trader — co to mówi o luce?"
              value={wasNot}
              onChange={setWasNot}
              rows={3}
            />
          </div>
        </div>

        <div>
          <SectionHeader number="13" title="MAPA ZAGROŻEŃ PRZYSZŁEGO TYGODNIA (PRE-MORTEM)" />
          <TextArea
            label="Wydarzenia makro / kalendarzowe pułapki / osobiste obciążenia. Gdzie najprawdopodobniej zrobię błąd — i jak się obronić?"
            value={threats}
            onChange={setThreats}
            rows={4}
          />
        </div>
      </div>

      <div className="sticky bottom-0 border-t" style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}>
        <div className="mx-auto px-4 py-3 flex justify-between" style={{ maxWidth: "var(--content-max-width)" }}>
          <a href={`/weekly/${weekStart}/step/7`} style={{ color: "var(--color-muted)", fontSize: 14 }}>← Wstecz</a>
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
