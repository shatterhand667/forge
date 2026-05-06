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
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="10" title="STAN MENTALNY PO SESJI" />
        <DotRow label="Stan mentalny po sesji:" value={mentalAfter} onChange={setMentalAfter} />
        <TextArea label="Co na niego wpłynęło?" value={whatShapedIt} onChange={setWhatShapedIt} rows={4} />
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 border-t"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div
          className="mx-auto px-4 py-3 flex justify-between"
          style={{ maxWidth: "var(--content-max-width)" }}
        >
          <a href={`/cards/${date}/evening/10`} style={{ color: "var(--color-muted)", fontSize: 14 }}>
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
