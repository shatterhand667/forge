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

      <div
        className="fixed bottom-0 left-0 right-0 border-t"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div
          className="mx-auto px-4 py-3 flex justify-between"
          style={{ maxWidth: "var(--content-max-width)" }}
        >
          <a href={`/cards/${date}/evening/14`} style={{ color: "var(--color-muted)", fontSize: "var(--font-size-body)" }}>
            ← Wstecz
          </a>
          <button
            onClick={handleFinish}
            disabled={saving}
            className="px-6 py-2 rounded font-medium"
            style={{ background: "var(--color-gold)", color: "var(--color-white)", fontSize: "var(--font-size-body)" }}
          >
            {saving ? "Zapisuję..." : "Zakończ dzień"}
          </button>
        </div>
      </div>
    </WizardLayout>
  )
}
