"use client"

import { useState, useTransition, useCallback, useRef } from "react"
import {
  savePlaybookField,
  savePlaybookJson,
  createSetup,
  updateSetup,
  deleteSetup,
  createTrigger,
  updateTrigger,
  deleteTrigger,
} from "@/actions/playbook"

type Setup = {
  id: string
  name: string
  tier: string | null
  description: string | null
  criteria: string[] | null
  invalidation: string | null
  bestContext: string | null
  order: number
}

type Trigger = {
  id: string
  name: string
  description: string | null
  order: number
}

type Playbook = {
  tierADescription: string | null
  tierACriteria: string[] | null
  tierAMarketContext: string | null
  tierAInvalidation: string | null
  tierANotes: string | null
  tierBDescription: string | null
  tierBCriteria: string[] | null
  tierBMarketContext: string | null
  tierBInvalidation: string | null
  tierBNotes: string | null
  tierCDescription: string | null
  tierCCriteria: string[] | null
  tierCMarketContext: string | null
  tierCInvalidation: string | null
  tierCNotes: string | null
  maxDailyLoss: number | null
  maxWeeklyLoss: number | null
  maxRiskPerTrade: number | null
  maxOpenPositions: number | null
  hardRules: string[] | null
  setups: Setup[]
  triggers: Trigger[]
}

type Props = { playbook: Playbook | null }

// ── shared styles ──────────────────────────────────────────────────────────────

const sectionHeaderStyle: React.CSSProperties = {
  background: "var(--color-mid)",
  color: "#fff",
  padding: "5px 12px 5px 16px",
  fontSize: "var(--font-size-tiny)",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  borderRadius: 2,
  position: "relative",
  margin: "20px 0 10px",
  borderLeft: "4px solid var(--color-gold)",
}

const fieldRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 8,
  padding: "4px 0",
  borderBottom: "0.5px solid var(--color-border)",
  minHeight: 26,
}

const labelStyle: React.CSSProperties = {
  color: "var(--color-muted)",
  minWidth: 190,
  whiteSpace: "nowrap",
  fontSize: "var(--font-size-tiny)",
  flexShrink: 0,
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  fontSize: "var(--font-size-tiny)",
  color: "var(--color-text)",
  fontFamily: "inherit",
  padding: 0,
}

const textareaStyle: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  fontSize: "var(--font-size-tiny)",
  color: "var(--color-text)",
  fontFamily: "inherit",
  padding: 0,
  resize: "none",
  lineHeight: 1.5,
  minHeight: 22,
}

// ── sub-components ─────────────────────────────────────────────────────────────

function AutoTextarea({
  value,
  onChange,
  onBlur,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  placeholder?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  function adjust() {
    const el = ref.current
    if (!el) return
    el.style.height = "0"
    el.style.height = el.scrollHeight + "px"
  }

  return (
    <textarea
      ref={ref}
      style={textareaStyle}
      value={value}
      placeholder={placeholder}
      onInput={adjust}
      onFocus={adjust}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      rows={1}
    />
  )
}

function BulletList({
  items,
  onSave,
  placeholder,
}: {
  items: string[]
  onSave: (items: string[]) => void
  placeholder?: string
}) {
  const [list, setList] = useState<string[]>(items.length > 0 ? items : [""])
  const [, startTransition] = useTransition()

  function save(next: string[]) {
    setList(next)
    startTransition(async () => {
      await onSave(next.filter((s) => s.trim() !== ""))
    })
  }

  function update(i: number, val: string) {
    const next = [...list]
    next[i] = val
    setList(next)
  }

  function blur(i: number) {
    const trimmed = list[i].trim()
    const next = [...list]
    next[i] = trimmed
    // auto-add empty row after last non-empty
    const filtered = next.filter((s) => s !== "")
    if (filtered.length === 0) {
      save([""])
    } else {
      save([...filtered, ""])
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === "Enter") {
      e.preventDefault()
      const next = [...list]
      next.splice(i + 1, 0, "")
      setList(next)
      setTimeout(() => {
        const inputs = document.querySelectorAll<HTMLInputElement>(`[data-bullet]`)
        inputs[i + 1]?.focus()
      }, 0)
    }
    if (e.key === "Backspace" && list[i] === "" && list.length > 1) {
      e.preventDefault()
      const next = list.filter((_, idx) => idx !== i)
      save(next.length === 0 ? [""] : next)
    }
  }

  return (
    <div style={{ flex: 1 }}>
      {list.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <span style={{ color: "var(--color-gold)", fontSize: 10, flexShrink: 0 }}>▸</span>
          <input
            data-bullet
            type="text"
            style={{ ...inputStyle, flex: 1 }}
            value={item}
            placeholder={i === 0 ? (placeholder ?? "Dodaj punkt...") : ""}
            onChange={(e) => update(i, e.target.value)}
            onBlur={() => blur(i)}
            onKeyDown={(e) => handleKey(e, i)}
          />
        </div>
      ))}
    </div>
  )
}

// ── tier card ──────────────────────────────────────────────────────────────────

function TierCard({
  tier,
  data,
  prefix,
}: {
  tier: "A" | "B" | "C"
  data: {
    description: string | null
    criteria: string[] | null
    marketContext: string | null
    invalidation: string | null
    notes: string | null
  }
  prefix: "tierA" | "tierB" | "tierC"
}) {
  const [desc, setDesc] = useState(data.description ?? "")
  const [marketCtx, setMarketCtx] = useState(data.marketContext ?? "")
  const [invalidation, setInvalidation] = useState(data.invalidation ?? "")
  const [notes, setNotes] = useState(data.notes ?? "")
  const [, startTransition] = useTransition()

  const save = useCallback(
    (field: string, value: string) => {
      startTransition(async () => {
        await savePlaybookField(`${prefix}${field}`, value || null)
      })
    },
    [prefix]
  )

  const saveCriteria = useCallback(
    (items: string[]) => {
      startTransition(async () => {
        await savePlaybookJson(`${prefix}Criteria`, items)
      })
    },
    [prefix]
  )

  const tierColor = tier === "A" ? "var(--color-gold)" : tier === "B" ? "var(--color-mid)" : "var(--color-muted)"

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: 4,
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "var(--color-light)",
          borderBottom: "1px solid var(--color-border)",
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            background: tierColor,
            color: tier === "C" ? "var(--color-text)" : "#fff",
            fontSize: 11,
            fontWeight: 700,
            padding: "1px 8px",
            borderRadius: 2,
          }}
        >
          TIER {tier}
        </span>
      </div>
      <div style={{ padding: "8px 12px" }}>
        <div style={fieldRowStyle}>
          <span style={labelStyle}>Opis ogólny:</span>
          <AutoTextarea
            value={desc}
            onChange={setDesc}
            onBlur={() => save("Description", desc)}
            placeholder="Krótki opis rodzaju setupu..."
          />
        </div>
        <div style={{ ...fieldRowStyle, alignItems: "flex-start", paddingTop: 6 }}>
          <span style={{ ...labelStyle, paddingTop: 2 }}>Kryteria wejścia:</span>
          <BulletList
            items={data.criteria ?? []}
            onSave={saveCriteria}
            placeholder="Dodaj kryterium..."
          />
        </div>
        <div style={fieldRowStyle}>
          <span style={labelStyle}>Wymagany kontekst rynkowy:</span>
          <AutoTextarea
            value={marketCtx}
            onChange={setMarketCtx}
            onBlur={() => save("MarketContext", marketCtx)}
            placeholder="Warunki rynkowe, w których setup działa..."
          />
        </div>
        <div style={fieldRowStyle}>
          <span style={labelStyle}>Unieważnienie:</span>
          <AutoTextarea
            value={invalidation}
            onChange={setInvalidation}
            onBlur={() => save("Invalidation", invalidation)}
            placeholder="Co oznacza, że setup nie obowiązuje..."
          />
        </div>
        <div style={{ ...fieldRowStyle, borderBottom: "none" }}>
          <span style={labelStyle}>Notatki / przykłady:</span>
          <AutoTextarea
            value={notes}
            onChange={setNotes}
            onBlur={() => save("Notes", notes)}
            placeholder="Dodatkowe uwagi, linki do screenshotów..."
          />
        </div>
      </div>
    </div>
  )
}

// ── setup card ─────────────────────────────────────────────────────────────────

function SetupCard({ setup, onDelete }: { setup: Setup; onDelete: () => void }) {
  const [name, setName] = useState(setup.name ?? "")
  const [desc, setDesc] = useState(setup.description ?? "")
  const [invalidation, setInvalidation] = useState(setup.invalidation ?? "")
  const [bestContext, setBestContext] = useState(setup.bestContext ?? "")
  const [, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(true)

  function save(data: Parameters<typeof updateSetup>[1]) {
    startTransition(async () => {
      await updateSetup(setup.id, data)
    })
  }

  function handleDelete() {
    if (!confirm(`Usunąć setup "${name || "bez nazwy"}"?`)) return
    startTransition(async () => {
      await deleteSetup(setup.id)
      onDelete()
    })
  }

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: 4,
        marginBottom: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "var(--color-light)",
          borderBottom: expanded ? "1px solid var(--color-border)" : "none",
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-muted)",
            fontSize: 10,
            padding: 0,
            flexShrink: 0,
          }}
        >
          {expanded ? "▾" : "▸"}
        </button>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => save({ name })}
          placeholder="Nazwa setupu..."
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontWeight: 600,
            fontSize: "var(--font-size-tiny)",
            color: "var(--color-text)",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleDelete}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-muted)",
            fontSize: 14,
            padding: "0 2px",
            lineHeight: 1,
          }}
          title="Usuń setup"
        >
          ×
        </button>
      </div>

      {expanded && (
        <div style={{ padding: "8px 12px" }}>
          <div style={fieldRowStyle}>
            <span style={labelStyle}>Opis:</span>
            <AutoTextarea
              value={desc}
              onChange={setDesc}
              onBlur={() => save({ description: desc || null })}
              placeholder="Czym jest ten setup?"
            />
          </div>
          <div style={{ ...fieldRowStyle, alignItems: "flex-start", paddingTop: 6 }}>
            <span style={{ ...labelStyle, paddingTop: 2 }}>Warunki wejścia:</span>
            <BulletList
              items={setup.criteria ?? []}
              onSave={(items) => save({ criteria: items })}
              placeholder="Dodaj warunek..."
            />
          </div>
          <div style={fieldRowStyle}>
            <span style={labelStyle}>Unieważnienie:</span>
            <AutoTextarea
              value={invalidation}
              onChange={setInvalidation}
              onBlur={() => save({ invalidation: invalidation || null })}
              placeholder="Kiedy setup przestaje obowiązywać..."
            />
          </div>
          <div style={{ ...fieldRowStyle, borderBottom: "none" }}>
            <span style={labelStyle}>Najlepszy kontekst rynkowy:</span>
            <AutoTextarea
              value={bestContext}
              onChange={setBestContext}
              onBlur={() => save({ bestContext: bestContext || null })}
              placeholder="W jakich warunkach setup działa najlepiej..."
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── trigger card ───────────────────────────────────────────────────────────────

function TriggerCard({ trigger, onDelete }: { trigger: Trigger; onDelete: () => void }) {
  const [name, setName] = useState(trigger.name ?? "")
  const [desc, setDesc] = useState(trigger.description ?? "")
  const [, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(true)

  function save(data: Parameters<typeof updateTrigger>[1]) {
    startTransition(async () => {
      await updateTrigger(trigger.id, data)
    })
  }

  function handleDelete() {
    if (!confirm(`Usunąć trigger "${name || "bez nazwy"}"?`)) return
    startTransition(async () => {
      await deleteTrigger(trigger.id)
      onDelete()
    })
  }

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: 4,
        marginBottom: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "var(--color-light)",
          borderBottom: expanded ? "1px solid var(--color-border)" : "none",
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-muted)",
            fontSize: 10,
            padding: 0,
            flexShrink: 0,
          }}
        >
          {expanded ? "▾" : "▸"}
        </button>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => save({ name })}
          placeholder="Nazwa triggera..."
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontWeight: 600,
            fontSize: "var(--font-size-tiny)",
            color: "var(--color-text)",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleDelete}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-muted)",
            fontSize: 14,
            padding: "0 2px",
            lineHeight: 1,
          }}
          title="Usuń trigger"
        >
          ×
        </button>
      </div>

      {expanded && (
        <div style={{ padding: "8px 12px" }}>
          <div style={{ ...fieldRowStyle, borderBottom: "none" }}>
            <span style={labelStyle}>Opis:</span>
            <AutoTextarea
              value={desc}
              onChange={setDesc}
              onBlur={() => save({ description: desc || null })}
              placeholder="Opcjonalny opis triggera..."
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────────

export function PlaybookView({ playbook: initial }: Props) {
  const pb = initial ?? {
    tierADescription: null, tierACriteria: null, tierAMarketContext: null,
    tierAInvalidation: null, tierANotes: null,
    tierBDescription: null, tierBCriteria: null, tierBMarketContext: null,
    tierBInvalidation: null, tierBNotes: null,
    tierCDescription: null, tierCCriteria: null, tierCMarketContext: null,
    tierCInvalidation: null, tierCNotes: null,
    maxDailyLoss: null, maxWeeklyLoss: null, maxRiskPerTrade: null,
    maxOpenPositions: null, hardRules: null,
    setups: [],
    triggers: [],
  }

  const [setups, setSetups] = useState<Setup[]>(pb.setups)
  const [triggers, setTriggers] = useState<Trigger[]>(pb.triggers)
  const [maxDailyLoss, setMaxDailyLoss] = useState(pb.maxDailyLoss?.toString() ?? "")
  const [maxWeeklyLoss, setMaxWeeklyLoss] = useState(pb.maxWeeklyLoss?.toString() ?? "")
  const [maxRiskPerTrade, setMaxRiskPerTrade] = useState(pb.maxRiskPerTrade?.toString() ?? "")
  const [maxOpenPositions, setMaxOpenPositions] = useState(pb.maxOpenPositions?.toString() ?? "")
  const [tiersOpen, setTiersOpen] = useState(false)
  const [riskOpen, setRiskOpen] = useState(false)
  const [setupsOpen, setSetupsOpen] = useState(false)
  const [triggersOpen, setTriggersOpen] = useState(false)
  const [, startTransition] = useTransition()

  function saveNum(field: string, val: string) {
    const n = parseFloat(val)
    startTransition(async () => {
      await savePlaybookField(field, isNaN(n) ? null : n)
    })
  }

  function saveHardRules(items: string[]) {
    startTransition(async () => {
      await savePlaybookJson("hardRules", items)
    })
  }

  async function handleAddSetup() {
    const s = await createSetup()
    setSetups((prev) => [...prev, s as Setup])
  }

  function handleDeleteSetup(id: string) {
    setSetups((prev) => prev.filter((s) => s.id !== id))
  }

  async function handleAddTrigger() {
    const t = await createTrigger()
    setTriggers((prev) => [...prev, t as Trigger])
  }

  function handleDeleteTrigger(id: string) {
    setTriggers((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div>
      {/* TRIGGERY */}
      <button
        onClick={() => setTriggersOpen((v) => !v)}
        style={{ ...sectionHeaderStyle, width: "100%", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", border: "none" }}
      >
        <span>Triggery ({triggers.length})</span>
        <span style={{ fontSize: 12 }}>{triggersOpen ? "▾" : "▸"}</span>
      </button>

      {triggersOpen && triggers.map((t) => (
        <TriggerCard key={t.id} trigger={t} onDelete={() => handleDeleteTrigger(t.id)} />
      ))}

      {triggersOpen && (
        <button
          onClick={handleAddTrigger}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px dashed var(--color-border)",
            borderRadius: 4,
            background: "transparent",
            color: "var(--color-muted)",
            fontSize: "var(--font-size-tiny)",
            cursor: "pointer",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          + Dodaj trigger
        </button>
      )}

      {/* SETUPY */}
      <button
        onClick={() => setSetupsOpen((v) => !v)}
        style={{ ...sectionHeaderStyle, width: "100%", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", border: "none" }}
      >
        <span>Setupy ({setups.length})</span>
        <span style={{ fontSize: 12 }}>{setupsOpen ? "▾" : "▸"}</span>
      </button>

      {setupsOpen && setups.map((s) => (
        <SetupCard key={s.id} setup={s} onDelete={() => handleDeleteSetup(s.id)} />
      ))}

      {setupsOpen && <button
        onClick={handleAddSetup}
        style={{
          width: "100%",
          padding: "8px",
          border: "1px dashed var(--color-border)",
          borderRadius: 4,
          background: "transparent",
          color: "var(--color-muted)",
          fontSize: "var(--font-size-tiny)",
          cursor: "pointer",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        + Dodaj setup
      </button>}

      {/* TIERY */}
      <button
        onClick={() => setTiersOpen((v) => !v)}
        style={{ ...sectionHeaderStyle, width: "100%", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", border: "none" }}
      >
        <span>Tiery zagrań</span>
        <span style={{ fontSize: 12 }}>{tiersOpen ? "▾" : "▸"}</span>
      </button>

      {tiersOpen && (["A", "B", "C"] as const).map((t) => (
        <TierCard
          key={t}
          tier={t}
          prefix={`tier${t}` as "tierA" | "tierB" | "tierC"}
          data={{
            description: pb[`tier${t}Description`],
            criteria: pb[`tier${t}Criteria`] as string[] | null,
            marketContext: pb[`tier${t}MarketContext`],
            invalidation: pb[`tier${t}Invalidation`],
            notes: pb[`tier${t}Notes`],
          }}
        />
      ))}

      {/* ZASADY RYZYKA */}
      <button
        onClick={() => setRiskOpen((v) => !v)}
        style={{ ...sectionHeaderStyle, width: "100%", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", border: "none" }}
      >
        <span>Zasady ryzyka</span>
        <span style={{ fontSize: 12 }}>{riskOpen ? "▾" : "▸"}</span>
      </button>

      {riskOpen && <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: 4,
          padding: "8px 12px",
          marginBottom: 12,
        }}
      >
        <div style={fieldRowStyle}>
          <span style={labelStyle}>Max strata dzienna ($):</span>
          <input
            type="number"
            style={inputStyle}
            value={maxDailyLoss}
            onChange={(e) => setMaxDailyLoss(e.target.value)}
            onBlur={() => saveNum("maxDailyLoss", maxDailyLoss)}
            placeholder="np. 200"
          />
        </div>
        <div style={fieldRowStyle}>
          <span style={labelStyle}>Max strata tygodniowa ($):</span>
          <input
            type="number"
            style={inputStyle}
            value={maxWeeklyLoss}
            onChange={(e) => setMaxWeeklyLoss(e.target.value)}
            onBlur={() => saveNum("maxWeeklyLoss", maxWeeklyLoss)}
            placeholder="np. 500"
          />
        </div>
        <div style={fieldRowStyle}>
          <span style={labelStyle}>Max ryzyko na trade (%):</span>
          <input
            type="number"
            style={inputStyle}
            value={maxRiskPerTrade}
            onChange={(e) => setMaxRiskPerTrade(e.target.value)}
            onBlur={() => saveNum("maxRiskPerTrade", maxRiskPerTrade)}
            placeholder="np. 1"
          />
        </div>
        <div style={fieldRowStyle}>
          <span style={labelStyle}>Max otwarte pozycje:</span>
          <input
            type="number"
            style={inputStyle}
            value={maxOpenPositions}
            onChange={(e) => setMaxOpenPositions(e.target.value)}
            onBlur={() => saveNum("maxOpenPositions", maxOpenPositions)}
            placeholder="np. 3"
          />
        </div>
        <div style={{ ...fieldRowStyle, alignItems: "flex-start", paddingTop: 6, borderBottom: "none" }}>
          <span style={{ ...labelStyle, paddingTop: 2 }}>Zasady których nie wolno łamać:</span>
          <BulletList
            items={(pb.hardRules as string[]) ?? []}
            onSave={saveHardRules}
            placeholder="Dodaj zasadę..."
          />
        </div>
      </div>}
    </div>
  )
}
