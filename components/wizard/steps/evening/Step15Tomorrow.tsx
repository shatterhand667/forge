"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, TextArea, TextInput } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import type { DailyCard } from "@prisma/client"

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: any[] }
  date: string
  step: number
}

export function Step15Tomorrow({ card, date, step }: Props) {
  const router = useRouter()
  const [todayInOneSentence, setTodayInOneSentence] = useState(card.todayInOneSentence ?? "")
  const [tomorrowRemember, setTomorrowRemember] = useState(card.tomorrowRemember ?? "")
  const [saving, setSaving] = useState(false)

  async function handleFinish() {
    setSaving(true)
    await updateDailyCard(card.id, { todayInOneSentence, tomorrowRemember, status: "COMPLETED" })
    router.push(`/cards/${date}/complete`)
  }

  return (
    <WizardLayout
      date={date}
      session="evening"
      currentStep={step}
      totalSteps={15}
      stepLabel="Lekcja na jutro"
      prevHref={`/cards/${date}/evening/14`}
      onNext={handleFinish}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : "Zakończ dzień"}
    >
      <div className="flex flex-col gap-6">
        <div>
          <SectionHeader number="14" title="LEKCJA NA JUTRO" />
          <div className="flex flex-col gap-4 mt-4">
            <TextInput
              label="Dziś w jednym zdaniu:"
              value={todayInOneSentence}
              onChange={setTodayInOneSentence}
              placeholder="Jak opisałbyś ten dzień w jednym zdaniu?"
            />
            <TextArea
              label="Jutro pamiętaj o:"
              value={tomorrowRemember}
              onChange={setTomorrowRemember}
              rows={6}
              placeholder="To pole pojawi się jutro na górze Twojej karty dziennej."
            />
            <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", fontStyle: "italic" }}>
              Lekcja pojawi się automatycznie na górze jutrzejszej karty dziennej.
            </p>
          </div>
        </div>
      </div>
    </WizardLayout>
  )
}
