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

export function Step2PersonalContext({ card, date, step }: Props) {
  const router = useRouter()
  const [sleep, setSleep] = useState<number | null>(card.sleep)
  const [energy, setEnergy] = useState<number | null>(card.energy)
  const [focus, setFocus] = useState<number | null>(card.focus)
  const [prepQuality, setPrepQuality] = useState<number | null>(card.prepQuality)
  const [moodNotes, setMoodNotes] = useState(card.moodNotes ?? "")
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateDailyCard(card.id, {
      sleep: sleep ?? undefined,
      energy: energy ?? undefined,
      focus: focus ?? undefined,
      prepQuality: prepQuality ?? undefined,
      moodNotes,
    })
    router.push(`/cards/${date}/morning/3`)
  }

  return (
    <WizardLayout
      date={date}
      session="morning"
      currentStep={step}
      totalSteps={15}
      stepLabel="Kontekst osobisty"
      prevHref={`/cards/${date}/morning/1`}
      onNext={handleNext}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : "Dalej →"}
      lesson={card.yesterdayLesson}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="1" title="KONTEKST OSOBISTY (RANO)" />
        <div className="flex flex-col gap-1 py-2">
          <DotRow label="Sen:" value={sleep} onChange={setSleep} labelWidth="170px" options={[1,2,3,4,5,6,7,8,9,10]} />
          <DotRow label="Energia:" value={energy} onChange={setEnergy} labelWidth="170px" options={[1,2,3,4,5,6,7,8,9,10]} />
          <DotRow label="Fokus:" value={focus} onChange={setFocus} labelWidth="170px" options={[1,2,3,4,5,6,7,8,9,10]} />
          <DotRow label="Jakość przygotowania:" value={prepQuality} onChange={setPrepQuality} labelWidth="170px" options={[1,2,3,4,5,6,7,8,9,10]} />
        </div>
        <TextArea label="Nastrój / notatki:" value={moodNotes} onChange={setMoodNotes} rows={5} />
      </div>
    </WizardLayout>
  )
}
