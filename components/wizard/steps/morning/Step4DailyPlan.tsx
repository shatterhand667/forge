"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, TextInput, TextArea } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import type { DailyCard } from "@prisma/client"

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: any[] }
  date: string
  step: number
}

export function Step4DailyPlan({ card, date, step }: Props) {
  const router = useRouter()
  const [whatIfs, setWhatIfs] = useState(card.whatIfs ?? "")
  const [entryConditions, setEntryConditions] = useState(card.entryConditions ?? "")
  const [tierASetup, setTierASetup] = useState(card.tierASetup ?? "")
  const [tierBSetup, setTierBSetup] = useState(card.tierBSetup ?? "")
  const [tierCSetup, setTierCSetup] = useState(card.tierCSetup ?? "")
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateDailyCard(card.id, { whatIfs, entryConditions, tierASetup, tierBSetup, tierCSetup })
    router.push(`/cards/${date}/morning/5`)
  }

  return (
    <WizardLayout
      date={date}
      session="morning"
      currentStep={step}
      totalSteps={15}
      stepLabel="Plan dnia"
      prevHref={`/cards/${date}/morning/3`}
      onNext={handleNext}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : "Dalej →"}
      lesson={card.yesterdayLesson}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="3" title="PLAN DNIA" />
        <TextArea label="What-ifs (scenariusze):" value={whatIfs} onChange={setWhatIfs} rows={4} />
        <TextArea label="Warunki wejścia:" value={entryConditions} onChange={setEntryConditions} rows={3} />
        <TextInput label="Setup A (100% wielkości):" value={tierASetup} onChange={setTierASetup} />
        <TextInput label="Setup B (50% wielkości):" value={tierBSetup} onChange={setTierBSetup} />
        <TextInput label="Setup C (25% wielkości):" value={tierCSetup} onChange={setTierCSetup} />
        <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", fontStyle: "italic" }}>
          A = 100% wielkości · B = 50% · C = 25%
        </p>
      </div>
    </WizardLayout>
  )
}
