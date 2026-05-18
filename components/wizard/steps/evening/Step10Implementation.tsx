"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, ImplementationIntention } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import type { DailyCard } from "@prisma/client"

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: any[] }
  date: string
  step: number
}

export function Step10Implementation({ card, date, step }: Props) {
  const router = useRouter()
  const [improvementWhen, setImprovementWhen] = useState(card.improvementWhen ?? "")
  const [improvementThen, setImprovementThen] = useState(card.improvementThen ?? "")
  const [improvementExtra, setImprovementExtra] = useState(card.improvementExtra ?? "")
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateDailyCard(card.id, { improvementWhen, improvementThen, improvementExtra })
    router.push(`/cards/${date}/evening/11`)
  }

  return (
    <WizardLayout
      date={date}
      session="evening"
      currentStep={step}
      totalSteps={15}
      stepLabel="Intencja implementacyjna"
      prevHref={`/cards/${date}/evening/9`}
      onNext={handleNext}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : "Dalej →"}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="9" title="JEDNA RZECZ DO POPRAWY" />
        <ImplementationIntention
          whenValue={improvementWhen}
          thenValue={improvementThen}
          extraValue={improvementExtra}
          onChangeWhen={setImprovementWhen}
          onChangeThen={setImprovementThen}
          onChangeExtra={setImprovementExtra}
        />
      </div>
    </WizardLayout>
  )
}
