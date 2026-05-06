"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, TableInput } from "@/components/forge"
import { addTrade, updateTrade } from "@/actions/trades"
import type { DailyCard, Trade } from "@prisma/client"

const TRADE_COLUMNS = [
  { id: "time",      label: "Czas",    width: "7%" },
  { id: "trigger",   label: "Trigger", width: "13%", type: "textarea" as const },
  { id: "setup",     label: "Setup",   width: "15%", type: "textarea" as const },
  { id: "direction", label: "Kier.",   width: "7%",  type: "select" as const, options: ["long", "short"] },
  { id: "tier",      label: "Tier",    width: "7%",  type: "select" as const, options: ["A", "B", "C"] },
  { id: "rExpected", label: "R plan.", width: "10%", type: "number" as const },
  { id: "rActual",   label: "R real.", width: "10%", type: "number" as const },
  { id: "emotion",   label: "Emocja",  width: "13%", type: "textarea" as const },
  { id: "lessons",   label: "Lekcje",  width: "18%", type: "textarea" as const },
]

interface Props {
  card: DailyCard & { trades: Trade[]; emotionEntries: any[] }
  date: string
  step: number
}

export function Step6TradeLog({ card, date, step }: Props) {
  const router = useRouter()
  const [trades, setTrades] = useState(card.trades)

  async function handleAddRow() {
    const newTrade = await addTrade(card.id, {})
    setTrades((prev) => [...prev, newTrade])
  }

  async function handleUpdateRow(index: number, field: string, value: string | number) {
    const trade = trades[index]
    if (!trade) return
    setTrades((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)))
    await updateTrade(trade.id, { [field]: value } as any)
  }

  return (
    <WizardLayout
      date={date}
      session="evening"
      currentStep={step}
      totalSteps={15}
      stepLabel="Log transakcji"
      prevHref="/dashboard"
      nextHref={`/cards/${date}/evening/7`}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="5" title="LOG TRANSAKCJI" />
        <TableInput
          columns={TRADE_COLUMNS}
          rows={trades}
          onAddRow={handleAddRow}
          onUpdateRow={handleUpdateRow}
          addLabel="+ Dodaj transakcję"
          emptyRows={5}
        />
      </div>
    </WizardLayout>
  )
}
