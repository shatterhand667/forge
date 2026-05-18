"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, DotRow, TextArea } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import type { DailyCard } from "@prisma/client"

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: any[] }
  date: string
  step: number
}

export function Step11MentalState({ card, date, step }: Props) {
  const router = useRouter()
  const [mentalAfter, setMentalAfter] = useState<number | null>(card.mentalAfter)
  const [whatShapedIt, setWhatShapedIt] = useState(card.whatShapedIt ?? "")
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateDailyCard(card.id, {
      mentalAfter: mentalAfter ?? undefined,
      whatShapedIt,
    })
    router.push(`/cards/${date}/evening/12`)
  }

  return (
    <WizardLayout
      date={date}
      session="evening"
      currentStep={step}
      totalSteps={15}
      stepLabel="Stan mentalny"
      prevHref={`/cards/${date}/evening/10`}
      onNext={handleNext}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : "Dalej →"}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="10" title="STAN MENTALNY PO SESJI" />
        <DotRow label="Stan mentalny po sesji:" value={mentalAfter} onChange={setMentalAfter} labelWidth="160px" />
        <TextArea label="Co na niego wpłynęło?" value={whatShapedIt} onChange={setWhatShapedIt} rows={4} />
      </div>
    </WizardLayout>
  )
}
