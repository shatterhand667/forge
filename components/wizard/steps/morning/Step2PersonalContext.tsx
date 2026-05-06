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
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="1" title="KONTEKST OSOBISTY (RANO)" />
        <div className="flex flex-col gap-1 py-2">
          <DotRow label="Sen:" value={sleep} onChange={setSleep} />
          <DotRow label="Energia:" value={energy} onChange={setEnergy} />
          <DotRow label="Fokus:" value={focus} onChange={setFocus} />
          <DotRow label="Jakość przygotowania:" value={prepQuality} onChange={setPrepQuality} />
        </div>
        <TextArea label="Nastrój / notatki:" value={moodNotes} onChange={setMoodNotes} rows={5} />
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 border-t"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div
          className="mx-auto px-4 py-3 flex justify-between"
          style={{ maxWidth: "var(--content-max-width)" }}
        >
          <a href={`/cards/${date}/morning/1`} style={{ color: "var(--color-muted)", fontSize: 14 }}>
            ← Wstecz
          </a>
          <button
            onClick={handleNext}
            disabled={saving}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{
              background: "var(--color-mid)",
              color: "var(--color-white)",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Zapisuję..." : "Dalej →"}
          </button>
        </div>
      </div>
    </WizardLayout>
  )
}
