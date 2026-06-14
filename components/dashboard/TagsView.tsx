"use client"

import { useState, useTransition } from "react"
import { createTag, deleteTag } from "@/actions/tags"

type TagWithCount = {
  id: string
  name: string
  _count: { cards: number }
}

type CardEntry = {
  dailyCard: {
    date: Date
    processScore: number | null
    trades: { profitRaw: number | null }[]
  }
}

type TagDetail = {
  id: string
  name: string
  cards: CardEntry[]
}

interface Props {
  tags: TagWithCount[]
  selectedTag: TagDetail | null
}

export function TagsView({ tags, selectedTag }: Props) {
  const [newTagName, setNewTagName] = useState("")
  const [error, setError] = useState("")
  const [, startTransition] = useTransition()

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newTagName.trim()
    if (!trimmed) { setError("Nazwa nie może być pusta"); return }
    if (tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("Tag już istnieje")
      return
    }
    setError("")
    startTransition(async () => {
      await createTag(trimmed)
      setNewTagName("")
    })
  }

  function handleDelete(tagId: string, name: string) {
    if (!confirm(`Usunąć tag "${name}"? Zostanie usunięty ze wszystkich kart.`)) return
    startTransition(async () => { await deleteTag(tagId) })
  }

  if (selectedTag) {
    const rows = selectedTag.cards
      .map((entry) => {
        const tradesWithPnl = entry.dailyCard.trades.filter((t) => t.profitRaw != null)
        const pnl = tradesWithPnl.length > 0
          ? Math.round(tradesWithPnl.reduce((sum, t) => sum + t.profitRaw!, 0))
          : null
        const d = new Date(entry.dailyCard.date)
        const dateLabel = `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`
        const dateStr = d.toISOString().split("T")[0]
        return { dateStr, dateLabel, pnl, processScore: entry.dailyCard.processScore }
      })
      .sort((a, b) => b.dateStr.localeCompare(a.dateStr))

    return (
      <div>
        <a href="/dashboard?tab=tagi" style={{ color: "#4A9EE2", fontSize: "var(--font-size-tiny)" }}>
          ← Wszystkie tagi
        </a>
        <h2 style={{ marginTop: 12, marginBottom: 12, fontWeight: 700, fontSize: "var(--font-size-body)", textTransform: "uppercase" }}>
          {selectedTag.name} — {selectedTag.cards.length} {selectedTag.cards.length === 1 ? "dzień" : "dni"}
        </h2>
        {rows.length === 0 ? (
          <p style={{ color: "var(--color-muted)", fontSize: "var(--font-size-tiny)" }}>Brak dni z tym tagiem.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Data", "P&L", "Proces"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", paddingBottom: 6, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ dateStr, dateLabel, pnl, processScore }) => (
                <tr key={dateStr} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "7px 0", fontSize: "var(--font-size-tiny)" }}>
                    <a href={`/cards/${dateStr}/complete`} target="_blank" rel="noopener noreferrer" style={{ color: "#4A9EE2" }}>
                      {dateLabel}
                    </a>
                  </td>
                  <td style={{ padding: "7px 0", fontSize: "var(--font-size-tiny)", color: pnl == null ? "var(--color-muted)" : pnl >= 0 ? "#16a34a" : "#dc2626" }}>
                    {pnl == null ? "—" : `${pnl >= 0 ? "+" : ""}€${pnl}`}
                  </td>
                  <td style={{ padding: "7px 0", fontSize: "var(--font-size-tiny)", color: "var(--color-text)" }}>
                    {processScore != null ? `${processScore}/10` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8 }}>
        <input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Nazwa tagu..."
          style={{
            flex: 1,
            fontSize: "var(--font-size-tiny)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
            padding: "5px 10px",
          }}
        />
        <button
          type="submit"
          style={{
            background: "var(--color-mid)",
            color: "#fff",
            fontSize: "var(--font-size-tiny)",
            border: "none",
            borderRadius: 4,
            padding: "5px 14px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Dodaj
        </button>
      </form>
      {error && (
        <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-gold)" }}>{error}</p>
      )}
      {tags.length === 0 ? (
        <p style={{ color: "var(--color-muted)", fontSize: "var(--font-size-tiny)" }}>
          Brak tagów. Dodaj pierwszy tag powyżej.
        </p>
      ) : (
        <div>
          {tags.map((tag) => (
            <div
              key={tag.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <a
                href={`/dashboard?tab=tagi&tag=${tag.id}`}
                style={{ flex: 1, fontSize: "var(--font-size-tiny)", color: "var(--color-text)", textDecoration: "none" }}
              >
                {tag.name}
              </a>
              <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", marginRight: 12 }}>
                {tag._count.cards} dni
              </span>
              <button
                type="button"
                onClick={() => handleDelete(tag.id, tag.name)}
                aria-label={`Usuń tag ${tag.name}`}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", fontSize: 14, lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
