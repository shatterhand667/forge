"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, TableInput } from "@/components/forge"
import { AutoTextarea } from "@/components/forge/TableInput"
import { addTrade, updateTrade, importMT5Trades, mergeTrades, deleteTrade } from "@/actions/trades"
import type { DailyCard, Trade, DailyCardScreenshot } from "@prisma/client"
import Image from "next/image"

const TRADE_COLUMNS = [
  { id: "time",             label: "Czas",     width: "7%" },
  { id: "instrument",       label: "Instr.",   width: "8%" },
  { id: "playbookSetupId",  label: "Setup",    width: "9%" },
  { id: "trigger",          label: "Trigger",  width: "10%", type: "textarea" as const },
  { id: "direction",        label: "Kier.",    width: "7%",  type: "select" as const, options: ["long", "short"] },
  { id: "tier",             label: "Tier",     width: "6%",  type: "select" as const, options: ["A", "B", "C"] },
  { id: "volume",           label: "Wol.",     width: "5%",  type: "number" as const },
  { id: "rExpected",        label: "R plan.",  width: "7%",  type: "number" as const },
  { id: "rActual",          label: "R real.",  width: "8%",  type: "number" as const },
  { id: "profitRaw",        label: "P&L ($)",  width: "8%",  type: "number" as const },
  { id: "emotion",          label: "Emocja",   width: "8%",  type: "textarea" as const },
  { id: "lessons",          label: "Lekcje",   width: "17%", type: "textarea" as const },
]

type PlaybookSetup = { id: string; name: string; tier: string | null }

interface Props {
  card: DailyCard & { trades: Trade[]; emotionEntries: any[]; screenshots: DailyCardScreenshot[] }
  date: string
  step: number
  playbookSetups: PlaybookSetup[]
}

export function Step6TradeLog({ card, date, step, playbookSetups }: Props) {
  const router = useRouter()
  const [trades, setTrades] = useState(card.trades)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [merging, setMerging] = useState(false)
  const [screenshots, setScreenshots] = useState<DailyCardScreenshot[]>(card.screenshots)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mt5InputRef = useRef<HTMLInputElement>(null)

  const isEditing = card.status === "COMPLETED"

  async function handleAddRow() {
    const newTrade = await addTrade(card.id, {})
    setTrades(prev => [...prev, newTrade])
  }

  async function handleUpdateRow(index: number, field: string, value: string | number | null) {
    const trade = trades[index]
    if (!trade) return
    setTrades(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t))
    await updateTrade(trade.id, { [field]: value } as any)
  }

  async function handleImportMT5(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const content = await file.text()
    const newTrades = await importMT5Trades(card.id, content)
    setTrades(prev => [...prev, ...newTrades])
    setImporting(false)
    if (mt5InputRef.current) mt5InputRef.current.value = ""
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleMerge() {
    if (selected.size < 2 || merging) return
    setMerging(true)
    const ids = Array.from(selected)
    try {
      const merged = await mergeTrades(ids, card.id)
      if (!merged) return
      setTrades(prev => {
        const rest = prev.filter(t => !ids.includes(t.id) || t.id === merged.id)
        return rest.map(t => t.id === merged.id ? { ...t, ...merged } : t)
      })
      setSelected(new Set())
    } finally {
      setMerging(false)
    }
  }

  function handleSelectAll() {
    if (selected.size === trades.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(trades.map(t => t.id)))
    }
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return
    const ids = Array.from(selected)
    await Promise.all(ids.map(id => deleteTrade(id)))
    setTrades(prev => prev.filter(t => !ids.includes(t.id)))
    setSelected(new Set())
  }

  async function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    form.append("date", date)
    const res = await fetch("/api/upload/screenshot", { method: "POST", body: form })
    const json = await res.json()
    if (json.id && json.path) {
      setScreenshots(prev => [...prev, { id: json.id, path: json.path, dailyCardId: card.id, createdAt: new Date() }])
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleDeleteScreenshot(id: string) {
    await fetch("/api/upload/screenshot", { method: "DELETE", body: JSON.stringify({ id }), headers: { "Content-Type": "application/json" } })
    setScreenshots(prev => prev.filter(s => s.id !== id))
  }

  return (
    <WizardLayout
      date={date}
      session="evening"
      currentStep={step}
      totalSteps={15}
      stepLabel="Log transakcji"
      prevHref={isEditing ? `/cards/${date}/morning/5` : "/dashboard"}
      nextHref={`/cards/${date}/evening/7`}
    >
      <div className="flex flex-col gap-6">
        <SectionHeader number="5" title="LOG TRANSAKCJI" />

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 items-center">
          <input
            ref={mt5InputRef}
            type="file"
            accept=".csv,.txt,.htm,.html"
            className="hidden"
            onChange={handleImportMT5}
          />
          <button
            type="button"
            onClick={() => mt5InputRef.current?.click()}
            disabled={importing}
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
            {importing ? "Importuję..." : "↑ Importuj z MT5"}
          </button>

          {selected.size >= 1 && (
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
          )}
          {selected.size >= 2 && (
            <button
              type="button"
              onClick={handleMerge}
              disabled={merging}
              style={{
                fontSize: "var(--font-size-tiny)",
                color: "var(--color-white)",
                border: "none",
                borderRadius: 4,
                padding: "4px 12px",
                background: "var(--color-gold)",
                cursor: merging ? "wait" : "pointer",
                opacity: merging ? 0.6 : 1,
              }}
            >
              {merging ? "Łączę..." : `Połącz zaznaczone (${selected.size})`}
            </button>
          )}
        </div>

        {/* Table with checkboxes for merge */}
        <div className="w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: "var(--color-mid)" }}>
                <th style={{ width: 28, padding: "4px 6px", textAlign: "center", verticalAlign: "middle" }}>
                  <input
                    type="checkbox"
                    checked={trades.length > 0 && selected.size === trades.length}
                    ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < trades.length }}
                    onChange={handleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                {TRADE_COLUMNS.map(col => (
                  <th
                    key={col.id}
                    className="px-2 py-1 font-medium"
                    style={{ color: "var(--color-white)", fontSize: "var(--font-size-tiny)", width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, i) => (
                <tr key={trade.id} style={{ borderBottom: "0.5px solid var(--color-border)", background: selected.has(trade.id)
                    ? "var(--color-light)"
                    : trade.direction === "long"
                    ? "#f0faf4"
                    : trade.direction === "short"
                    ? "#fdf2f2"
                    : undefined }}>
                  <td style={{ padding: "4px 6px", borderRight: "0.5px solid var(--color-border)", verticalAlign: "middle", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selected.has(trade.id)}
                      onChange={() => toggleSelect(trade.id)}
                      style={{ cursor: "pointer" }}
                    />
                  </td>
                  {TRADE_COLUMNS.map(col => (
                    <td key={col.id} className="px-1 py-0.5" style={{ verticalAlign: "top", textAlign: "center", borderRight: "0.5px solid var(--color-border)" }}>
                      {col.id === "playbookSetupId" ? (
                        <div style={{ position: "relative" }}>
                          <div style={{
                            fontSize: "var(--font-size-tiny)",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            textAlign: "center",
                            minHeight: "1.4em",
                            padding: "2px 0",
                            color: "var(--color-text)",
                          }}>
                            {playbookSetups.find(s => s.id === String((trade as any).playbookSetupId ?? ""))?.name || "—"}
                          </div>
                          <select
                            value={String((trade as any).playbookSetupId ?? "")}
                            onChange={e => handleUpdateRow(i, "playbookSetupId", e.target.value || null)}
                            style={{
                              position: "absolute",
                              inset: 0,
                              opacity: 0,
                              cursor: "pointer",
                              width: "100%",
                              height: "100%",
                              fontSize: "var(--font-size-tiny)",
                            }}
                          >
                            <option value="">—</option>
                            {playbookSetups.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : col.id === "direction" ? (
                        <button
                          type="button"
                          onClick={() => {
                            const cur = (trade as any)[col.id]
                            const next = cur === "long" ? "short" : cur === "short" ? "long" : "long"
                            handleUpdateRow(i, col.id, next)
                          }}
                          style={{
                            fontSize: "var(--font-size-tiny)",
                            border: "none",
                            borderRadius: 3,
                            padding: "2px 6px",
                            cursor: "pointer",
                            background: (trade as any)[col.id] === "long" ? "#2D8C4E" : (trade as any)[col.id] === "short" ? "#D96060" : "var(--color-border)",
                            color: (trade as any)[col.id] ? "white" : "var(--color-mid)",
                            minWidth: 36,
                          }}
                        >
                          {(trade as any)[col.id] || "—"}
                        </button>
                      ) : col.type === "select" && col.options ? (
                        <select
                          value={String((trade as any)[col.id] ?? "")}
                          onChange={e => handleUpdateRow(i, col.id, e.target.value)}
                          className="w-full bg-transparent border-none outline-none"
                          style={{ fontSize: "var(--font-size-tiny)", textAlign: "center" }}
                        >
                          <option value="" />
                          {col.options.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : col.type === "textarea" ? (
                        <AutoTextarea
                          value={String((trade as any)[col.id] ?? "")}
                          onChange={v => handleUpdateRow(i, col.id, v)}
                          style={{ textAlign: "center", background: "rgba(0,0,0,0.03)", borderRadius: 2, padding: "2px 4px" }}
                        />
                      ) : (
                        <input
                          type={col.type ?? "text"}
                          value={
                            col.id === "profitRaw" && (trade as any)[col.id] != null
                              ? String(Math.round(Number((trade as any)[col.id]) * 100) / 100)
                              : String((trade as any)[col.id] ?? "")
                          }
                          step={col.id === "profitRaw" ? "0.01" : undefined}
                          onChange={e => {
                            const raw = e.target.value
                            if (col.type === "number") {
                              if (raw === "") {
                                handleUpdateRow(i, col.id, null)
                              } else {
                                let num = parseFloat(raw)
                                if (!isNaN(num)) {
                                  if (col.id === "profitRaw") num = Math.round(num * 100) / 100
                                  handleUpdateRow(i, col.id, num)
                                }
                              }
                            } else {
                              handleUpdateRow(i, col.id, raw)
                            }
                          }}
                          className="w-full border-none outline-none no-spinner"
                          style={{ fontSize: "var(--font-size-tiny)", textAlign: "center", background: "rgba(0,0,0,0.03)", borderRadius: 2, padding: "2px 4px", display: "block" }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {trades.length === 0 && Array.from({ length: 5 }).map((_, i) => (
                <tr key={`ph-${i}`} style={{ borderBottom: "0.5px solid var(--color-border)" }}>
                  <td style={{ padding: "4px 6px", borderRight: "0.5px solid var(--color-border)" }} />
                  {TRADE_COLUMNS.map(col => (
                    <td key={col.id} className="px-1 py-0.5" style={{ borderRight: "0.5px solid var(--color-border)" }}>
                      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-border)" }}>—</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {trades.length > 0 && (() => {
              const sumVolume  = trades.reduce((s, t) => s + (t.volume   ?? 0), 0)
              const sumRPlan  = trades.reduce((s, t) => s + (t.rExpected ?? 0), 0)
              const sumRReal  = trades.reduce((s, t) => s + (t.rActual  ?? 0), 0)
              const sumPnL    = trades.reduce((s, t) => s + (t.profitRaw ?? 0), 0)
              const roundedPnL = Math.round(sumPnL * 100) / 100
              const cellStyle: React.CSSProperties = {
                padding: "4px 8px",
                fontSize: "var(--font-size-tiny)",
                fontWeight: 600,
                borderTop: "1px solid var(--color-mid)",
                borderRight: "0.5px solid var(--color-border)",
              }
              return (
                <tfoot>
                  <tr style={{ background: "var(--color-light)" }}>
                    <td style={{ ...cellStyle, borderRight: "0.5px solid var(--color-border)" }} />
                    <td colSpan={6} style={{ ...cellStyle, color: "var(--color-mid)" }}>
                      {trades.length} {trades.length === 1 ? "transakcja" : trades.length < 5 ? "transakcje" : "transakcji"}
                    </td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>
                      {sumVolume > 0 ? sumVolume.toFixed(2) : "—"}
                    </td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>
                      {sumRPlan !== 0 ? sumRPlan.toFixed(2) : "—"}
                    </td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>
                      {sumRReal !== 0 ? sumRReal.toFixed(2) : "—"}
                    </td>
                    <td style={{
                      ...cellStyle,
                      textAlign: "right",
                      color: roundedPnL > 0 ? "#2D8C4E" : roundedPnL < 0 ? "#D96060" : undefined,
                    }}>
                      {roundedPnL > 0 ? "+" : ""}{roundedPnL.toFixed(2)}
                    </td>
                    <td colSpan={2} style={{ ...cellStyle, borderRight: "none" }} />
                  </tr>
                </tfoot>
              )
            })()}
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
            + Dodaj transakcję
          </button>
        </div>

        {/* Screenshots */}
        <div>
          <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 8 }}>
            Screenshoty dnia
          </p>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
          {screenshots.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {screenshots.map(s => (
                <div key={s.id} className="relative group" style={{ width: 160 }}>
                  <a href={s.path} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={s.path}
                      alt="Screenshot"
                      width={160}
                      height={100}
                      className="rounded"
                      style={{ width: 160, height: 100, objectFit: "cover", border: "1px solid var(--color-border)" }}
                    />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteScreenshot(s.id)}
                    className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center rounded-full"
                    style={{ width: 20, height: 20, background: "#D96060", color: "white", border: "none", cursor: "pointer", fontSize: 12, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
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
            {uploading ? "Wysyłam..." : "↑ Dodaj screenshot"}
          </button>
        </div>
      </div>
    </WizardLayout>
  )
}
