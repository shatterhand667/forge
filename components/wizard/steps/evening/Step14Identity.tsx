"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, TextArea } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import type { DailyCard } from "@prisma/client"

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: any[] }
  date: string
  step: number
}

export function Step14Identity({ card, date, step }: Props) {
  const router = useRouter()
  const [proudOf, setProudOf] = useState(card.proudOf ?? "")
  const [ashamedOf, setAshamedOf] = useState(card.ashamedOf ?? "")
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateDailyCard(card.id, { proudOf, ashamedOf })
    router.push(`/cards/${date}/evening/15`)
  }

  return (
    <WizardLayout
      date={date}
      session="evening"
      currentStep={step}
      totalSteps={15}
      stepLabel="Tożsamość"
      prevHref={`/cards/${date}/evening/13`}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="13" title="TOŻSAMOŚĆ" />
        <TextArea
          label="Z czego byłby DUMNY trader, którym chcę być?"
          value={proudOf}
          onChange={setProudOf}
          rows={5}
        />
        <TextArea
          label="Za co byłby ZAWSTYDZONY trader, którym chcę być?"
          value={ashamedOf}
          onChange={setAshamedOf}
          rows={5}
        />
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 border-t"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div
          className="mx-auto px-4 py-3 flex justify-between"
          style={{ maxWidth: "var(--content-max-width)" }}
        >
          <a href={`/cards/${date}/evening/13`} style={{ color: "var(--color-muted)", fontSize: 14 }}>
            ← Wstecz
          </a>
          <button
            onClick={handleNext}
            disabled={saving}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ background: "var(--color-mid)", color: "var(--color-white)", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Zapisuję..." : "Dalej →"}
          </button>
        </div>
      </div>
    </WizardLayout>
  )
}
