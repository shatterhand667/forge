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

export function Step12Practice({ card, date, step }: Props) {
  const router = useRouter()
  const [deliberatePractice, setDeliberatePractice] = useState(card.deliberatePractice ?? "")
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateDailyCard(card.id, { deliberatePractice })
    router.push(`/cards/${date}/evening/13`)
  }

  return (
    <WizardLayout
      date={date}
      session="evening"
      currentStep={step}
      totalSteps={15}
      stepLabel="Deliberate practice"
      prevHref={`/cards/${date}/evening/11`}
      onNext={handleNext}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : "Dalej →"}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="11" title="DELIBERATE PRACTICE (poza tradingiem)" />
        <TextArea
          label="Co zrobiłem dla swojej przewagi poza tradingiem?"
          value={deliberatePractice}
          onChange={setDeliberatePractice}
          rows={5}
        />
      </div>
    </WizardLayout>
  )
}
