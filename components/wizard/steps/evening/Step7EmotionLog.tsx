"use client"

import { useState } from "react"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, TableInput } from "@/components/forge"
import { addEmotionEntry, updateEmotionEntry } from "@/actions/emotions"
import type { DailyCard, EmotionEntry } from "@prisma/client"

const EMOTION_COLUMNS = [
  { id: "time",          label: "Czas",                width: "7%" },
  { id: "emotion",       label: "Emocja",              width: "15%" },
  { id: "triggerContext", label: "Trigger / kontekst",  width: "22%" },
  { id: "meaningSignal",  label: "Znaczenie (sygnał)",  width: "22%" },
  { id: "reaction",      label: "Reakcja",             width: "22%" },
]

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: EmotionEntry[] }
  date: string
  step: number
}

export function Step7EmotionLog({ card, date, step }: Props) {
  const [entries, setEntries] = useState(card.emotionEntries)

  async function handleAddRow() {
    const newEntry = await addEmotionEntry(card.id, {})
    setEntries((prev) => [...prev, newEntry])
  }

  async function handleUpdateRow(index: number, field: string, value: string | number) {
    const entry = entries[index]
    if (!entry) return
    await updateEmotionEntry(entry.id, { [field]: String(value) } as any)
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
  }

  return (
    <WizardLayout
      date={date}
      session="evening"
      currentStep={step}
      totalSteps={15}
      stepLabel="Log emocji"
      prevHref={`/cards/${date}/evening/6`}
      nextHref={`/cards/${date}/evening/8`}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="6" title="LOG EMOCJI" />
        <TableInput
          columns={EMOTION_COLUMNS}
          rows={entries}
          onAddRow={handleAddRow}
          onUpdateRow={handleUpdateRow}
          addLabel="+ Dodaj emocję"
          emptyRows={4}
        />
      </div>
    </WizardLayout>
  )
}
