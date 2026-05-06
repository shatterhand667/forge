"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, TextArea, BridgeIndicator } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import type { DailyCard } from "@prisma/client"

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: any[] }
  date: string
  step: number
  bridge2Items: string[]
}

export function Step5PreMortem({ card, date, step, bridge2Items }: Props) {
  const router = useRouter()
  const [preMortem, setPreMortem] = useState(card.preMortem ?? "")
  const [dailyGoal, setDailyGoal] = useState(card.dailyGoal ?? "")
  const [saving, setSaving] = useState(false)

  function applyBridgeItems() {
    const text = bridge2Items.map((item, i) => `${i + 1}. ${item}`).join("\n")
    setPreMortem((prev) => (prev ? `${prev}\n${text}` : text))
  }

  async function handleGoTrade() {
    setSaving(true)
    await updateDailyCard(card.id, { preMortem, dailyGoal, status: "MORNING" })
    router.push("/dashboard")
  }

  return (
    <WizardLayout
      date={date}
      session="morning"
      currentStep={step}
      totalSteps={15}
      stepLabel="Pre-mortem"
      prevHref={`/cards/${date}/morning/4`}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="4" title="PRE-MORTEM" />

        {bridge2Items.length > 0 && (
          <div>
            <BridgeIndicator source="z ostatniego Weekly Review" />
            <button
              type="button"
              onClick={applyBridgeItems}
              className="text-sm px-3 py-1 rounded mb-2"
              style={{
                background: "var(--color-light)",
                color: "var(--color-mid)",
                border: `1px solid var(--color-gold)`,
              }}
            >
              ↗ Wstaw sugestie z Weekly Review
            </button>
          </div>
        )}

        <TextArea label="Co mogę dziś zepsuć?" value={preMortem} onChange={setPreMortem} rows={6} />
        <TextArea label="Cel dzienny:" value={dailyGoal} onChange={setDailyGoal} rows={2} />
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 border-t"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div
          className="mx-auto px-4 py-3 flex justify-between"
          style={{ maxWidth: "var(--content-max-width)" }}
        >
          <a href={`/cards/${date}/morning/4`} style={{ color: "var(--color-muted)", fontSize: 14 }}>
            ← Wstecz
          </a>
          <button
            onClick={handleGoTrade}
            disabled={saving}
            className="px-6 py-2 rounded font-medium"
            style={{ background: "var(--color-gold)", color: "var(--color-white)", fontSize: 14 }}
          >
            {saving ? "Zapisuję..." : "Idę tradować →"}
          </button>
        </div>
      </div>
    </WizardLayout>
  )
}
