"use client"

import { useState } from "react"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader } from "@/components/forge"
import { AutoTextarea } from "@/components/forge/TableInput"
import { addEmotionEntry, updateEmotionEntry, deleteEmotionEntry } from "@/actions/emotions"
import type { DailyCard, EmotionEntry } from "@prisma/client"

const EMOTION_COLUMNS = [
  { id: "time",           label: "Czas",               width: "7%" },
  { id: "emotion",        label: "Emocja",             width: "15%",
    tooltip: "Nazwa stanu: strach, frustracja, euforia, niecierpliwość, spokój, pewność, znudzenie…" },
  { id: "triggerContext", label: "Trigger / kontekst", width: "26%", type: "textarea" as const,
    tooltip: "Co wywołało tę emocję — sytuacja rynkowa, zdarzenie, myśl. Np. przebicie ważnego poziomu, strata na poprzednim trade, nudny rynek." },
  { id: "meaningSignal",  label: "Znaczenie (sygnał)", width: "26%", type: "textarea" as const,
    tooltip: "Co ta emocja sygnalizuje — co mózg próbuje Ci powiedzieć. Np. widzę setup, ale brakuje mi potwierdzenia; chcę odrobić stratę." },
  { id: "reaction",       label: "Reakcja",            width: "26%", type: "textarea" as const,
    tooltip: "Co faktycznie zrobiłeś. Np. wszedłem mimo braku setupu, odpuściłem i poczekałem, zamknąłem pozycję za wcześnie." },
]

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: EmotionEntry[] }
  date: string
  step: number
}

export function Step7EmotionLog({ card, date, step }: Props) {
  const [entries, setEntries] = useState(card.emotionEntries)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  async function handleAddRow() {
    const newEntry = await addEmotionEntry(card.id, {})
    setEntries((prev) => [...prev, newEntry])
  }

  async function handleUpdateRow(index: number, field: string, value: string | number) {
    const entry = entries[index]
    if (!entry) return
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
    await updateEmotionEntry(entry.id, { [field]: String(value) } as any)
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSelectAll() {
    if (selected.size === entries.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(entries.map((e) => e.id)))
    }
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return
    const ids = Array.from(selected)
    await Promise.all(ids.map((id) => deleteEmotionEntry(id)))
    setEntries((prev) => prev.filter((e) => !ids.includes(e.id)))
    setSelected(new Set())
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

        {selected.size >= 1 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDeleteSelected}
              style={{
                fontSize: "var(--font-size-tiny)",
                color: "var(--color-white)",
                border: "none",
                borderRadius: 4,
                padding: "4px 12px",
                background: "#D96060",
                cursor: "pointer",
              }}
            >
              Usuń zaznaczone ({selected.size})
            </button>
          </div>
        )}

        <div className="w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: "var(--color-mid)" }}>
                <th style={{ width: 28, padding: "4px 6px", textAlign: "center", verticalAlign: "middle" }}>
                  <input
                    type="checkbox"
                    checked={entries.length > 0 && selected.size === entries.length}
                    ref={(el) => { if (el) el.indeterminate = selected.size > 0 && selected.size < entries.length }}
                    onChange={handleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                {EMOTION_COLUMNS.map((col) => (
                  <th
                    key={col.id}
                    className="px-2 py-1 font-medium"
                    style={{ color: "var(--color-white)", fontSize: "var(--font-size-tiny)", width: col.width }}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.tooltip && (
                        <span className="relative group inline-flex items-center">
                          <span className="cursor-help leading-none" style={{ fontSize: 10, opacity: 0.75 }}>ⓘ</span>
                          <span
                            className="absolute z-50 hidden group-hover:block rounded shadow-lg"
                            style={{
                              bottom: "calc(100% + 6px)",
                              left: "50%",
                              transform: "translateX(-50%)",
                              background: "var(--color-text)",
                              color: "var(--color-white)",
                              fontSize: "var(--font-size-tiny)",
                              padding: "6px 8px",
                              width: 200,
                              lineHeight: 1.5,
                              fontWeight: "normal",
                              whiteSpace: "normal",
                            }}
                          >
                            {col.tooltip}
                          </span>
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr
                  key={entry.id}
                  style={{
                    borderBottom: "0.5px solid var(--color-border)",
                    background: selected.has(entry.id) ? "var(--color-light)" : undefined,
                  }}
                >
                  <td style={{ padding: "4px 6px", borderRight: "0.5px solid var(--color-border)", verticalAlign: "middle", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selected.has(entry.id)}
                      onChange={() => toggleSelect(entry.id)}
                      style={{ cursor: "pointer" }}
                    />
                  </td>
                  {EMOTION_COLUMNS.map((col) => (
                    <td key={col.id} className="px-1 py-0.5" style={{ verticalAlign: "top", borderRight: "0.5px solid var(--color-border)" }}>
                      {col.type === "textarea" ? (
                        <AutoTextarea
                          value={String((entry as any)[col.id] ?? "")}
                          onChange={(v) => handleUpdateRow(i, col.id, v)}
                          style={{ background: "rgba(0,0,0,0.03)", borderRadius: 2, padding: "2px 4px" }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={String((entry as any)[col.id] ?? "")}
                          onChange={(e) => handleUpdateRow(i, col.id, e.target.value)}
                          className="w-full border-none outline-none"
                          style={{ fontSize: "var(--font-size-tiny)", background: "rgba(0,0,0,0.03)", borderRadius: 2, padding: "2px 4px", display: "block" }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {entries.length === 0 &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`ph-${i}`} style={{ borderBottom: "0.5px solid var(--color-border)" }}>
                    <td style={{ padding: "4px 6px", borderRight: "0.5px solid var(--color-border)" }} />
                    {EMOTION_COLUMNS.map((col) => (
                      <td key={col.id} className="px-1 py-0.5" style={{ borderRight: "0.5px solid var(--color-border)" }}>
                        <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-border)" }}>—</span>
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={handleAddRow}
            className="mt-2"
            style={{
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-mid)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              padding: "4px 12px",
              background: "var(--color-white)",
              cursor: "pointer",
            }}
          >
            + Dodaj emocję
          </button>
        </div>
      </div>
    </WizardLayout>
  )
}
