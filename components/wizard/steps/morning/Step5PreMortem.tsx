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

  const isEditing = card.status === "COMPLETED"

  async function handleNext() {
    setSaving(true)
    if (isEditing) {
      await updateDailyCard(card.id, { preMortem, dailyGoal })
      router.push(`/cards/${date}/evening/6`)
    } else {
      await updateDailyCard(card.id, { preMortem, dailyGoal, status: "MORNING" })
      router.push("/dashboard")
    }
  }

  return (
    <WizardLayout
      date={date}
      session="morning"
      currentStep={step}
      totalSteps={15}
      stepLabel="Pre-mortem"
      prevHref={`/cards/${date}/morning/4`}
      onNext={handleNext}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : isEditing ? "Dalej →" : "Idę tradować →"}
      lesson={card.yesterdayLesson}
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
    </WizardLayout>
  )
}
