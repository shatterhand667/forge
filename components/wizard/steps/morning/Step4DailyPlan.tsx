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

      <div
        className="fixed bottom-0 left-0 right-0 border-t"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div
          className="mx-auto px-4 py-3 flex justify-between"
          style={{ maxWidth: "var(--content-max-width)" }}
        >
          <a href={`/cards/${date}/morning/3`} style={{ color: "var(--color-muted)", fontSize: 14 }}>
            ← Wstecz
          </a>
          <button
            onClick={handleNext}
            disabled={saving}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ background: "var(--color-mid)", color: "var(--color-white)", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Zapisuję..." : "Dalej →"}
          </button>
        </div>
      </div>
    </WizardLayout>
  )
}
