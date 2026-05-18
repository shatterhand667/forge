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
      onNext={handleNext}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : "Dalej →"}
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
    </WizardLayout>
  )
}
