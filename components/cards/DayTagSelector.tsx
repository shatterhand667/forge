"use client"

import { useState, useTransition } from "react"
import { setCardTags } from "@/actions/tags"

interface Tag {
  id: string
  name: string
}

interface Props {
  cardId: string
  allTags: Tag[]
  initialTagIds: string[]
}

export function DayTagSelector({ cardId, allTags, initialTagIds }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialTagIds)
  const [, startTransition] = useTransition()

  function toggle(tagId: string) {
    let next: string[]
    if (selectedIds.includes(tagId)) {
      next = selectedIds.filter((id) => id !== tagId)
    } else {
      if (selectedIds.length >= 3) return
      next = [...selectedIds, tagId]
    }
    setSelectedIds(next)
    startTransition(() => { setCardTags(cardId, next) })
  }

  if (allTags.length === 0) {
    return (
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
          Brak tagów.{" "}
          <a href="/dashboard?tab=tagi" style={{ color: "#4A9EE2" }}>
            Dodaj tagi w zakładce Tagi →
          </a>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 300 }}>
      <p style={{
        fontSize: "var(--font-size-tiny)",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.3px",
        color: "var(--color-muted)",
      }}>
        Tagi dnia
      </p>
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => {
          const isSelected = selectedIds.includes(tag.id)
          const isDisabled = !isSelected && selectedIds.length >= 3
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => { if (!isDisabled) toggle(tag.id) }}
              style={{
                padding: "4px 12px",
                borderRadius: 4,
                fontSize: "var(--font-size-tiny)",
                cursor: isDisabled ? "not-allowed" : "pointer",
                background: isSelected ? "#4A9EE2" : "transparent",
                color: isSelected ? "#fff" : isDisabled ? "var(--color-border)" : "var(--color-muted)",
                border: `1px solid ${isSelected ? "#4A9EE2" : isDisabled ? "var(--color-border)" : "var(--color-muted)"}`,
                fontWeight: isSelected ? 700 : 400,
              }}
            >
              {tag.name}
            </button>
          )
        })}
      </div>
      <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
        Wybrano: {selectedIds.length}/3
      </p>
    </div>
  )
}
