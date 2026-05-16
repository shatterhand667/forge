"use client"

import { useRouter, useSearchParams } from "next/navigation"

const PRESETS = [
  { label: "2 tygodnie", value: "2w" },
  { label: "4 tygodnie", value: "4w" },
  { label: "3 miesiące", value: "3m" },
  { label: "Wszystko", value: "all" },
]

export function StatisticsFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const range = params.get("range")
  const from = params.get("from") ?? ""
  const to = params.get("to") ?? ""
  const hasCustom = !!(params.get("from") || params.get("to"))

  function setPreset(value: string) {
    router.push(`/statistics?range=${value}`)
  }

  function setCustom(field: "from" | "to", value: string) {
    const next = new URLSearchParams()
    if (field === "from") {
      if (value) next.set("from", value)
      if (to) next.set("to", to)
    } else {
      if (from) next.set("from", from)
      if (value) next.set("to", value)
    }
    router.push(`/statistics?${next.toString()}`)
  }

  const activePreset = hasCustom ? null : (range ?? "4w")

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      {PRESETS.map((p) => (
        <button
          key={p.value}
          onClick={() => setPreset(p.value)}
          style={{
            padding: "4px 12px",
            fontSize: "var(--font-size-tiny)",
            fontWeight: 700,
            border: "1px solid var(--color-border)",
            borderRadius: 2,
            cursor: "pointer",
            background: activePreset === p.value ? "var(--color-mid)" : "var(--color-light)",
            color: activePreset === p.value ? "#fff" : "var(--color-muted)",
          }}
        >
          {p.label}
        </button>
      ))}

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
        <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>Od</span>
        <input
          type="date"
          value={from}
          onChange={(e) => setCustom("from", e.target.value)}
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: 2,
            padding: "3px 6px",
            fontSize: "var(--font-size-tiny)",
            color: "var(--color-text)",
            background: hasCustom ? "var(--color-light)" : "transparent",
            outline: "none",
          }}
        />
        <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>Do</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setCustom("to", e.target.value)}
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: 2,
            padding: "3px 6px",
            fontSize: "var(--font-size-tiny)",
            color: "var(--color-text)",
            background: hasCustom ? "var(--color-light)" : "transparent",
            outline: "none",
          }}
        />
      </div>
    </div>
  )
}
