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

export function Step9Strengths({ card, date, step }: Props) {
  const router = useRouter()
  const [strengthsUsed, setStrengthsUsed] = useState(card.strengthsUsed ?? "")
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateDailyCard(card.id, { strengthsUsed })
    router.push(`/cards/${date}/evening/10`)
  }

  return (
    <WizardLayout
      date={date}
      session="evening"
      currentStep={step}
      totalSteps={15}
      stepLabel="Silne strony"
      prevHref={`/cards/${date}/evening/8`}
      onNext={handleNext}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : "Dalej →"}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="8" title="SILNE STRONY W AKCJI" />
        <TextArea
          label="Co wykorzystałem ze swoich silnych stron?"
          value={strengthsUsed}
          onChange={setStrengthsUsed}
          rows={6}
        />
      </div>
    </WizardLayout>
  )
}
