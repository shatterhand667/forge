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

export function Step3MarketContext({ card, date, step }: Props) {
  const router = useRouter()
  const [trendBias, setTrendBias] = useState(card.trendBias ?? "")
  const [keyLevels, setKeyLevels] = useState(card.keyLevels ?? "")
  const [macroNews, setMacroNews] = useState(card.macroNews ?? "")
  const [correlations, setCorrelations] = useState(card.correlations ?? "")
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateDailyCard(card.id, { trendBias, keyLevels, macroNews, correlations })
    router.push(`/cards/${date}/morning/4`)
  }

  return (
    <WizardLayout
      date={date}
      session="morning"
      currentStep={step}
      totalSteps={15}
      stepLabel="Kontekst rynkowy"
      prevHref={`/cards/${date}/morning/2`}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="2" title="KONTEKST RYNKOWY" />
        <TextInput label="Trend / bias:" value={trendBias} onChange={setTrendBias} />
        <TextArea label="Kluczowe poziomy:" value={keyLevels} onChange={setKeyLevels} rows={3} />
        <TextInput label="Makro / news:" value={macroNews} onChange={setMacroNews} />
        <TextInput label="Korelacje:" value={correlations} onChange={setCorrelations} />
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 border-t"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div
          className="mx-auto px-4 py-3 flex justify-between"
          style={{ maxWidth: "var(--content-max-width)" }}
        >
          <a href={`/cards/${date}/morning/2`} style={{ color: "var(--color-muted)", fontSize: 14 }}>
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
