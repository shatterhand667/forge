"use client"

import { useState, useTransition } from "react"
import { createTag, deleteTag } from "@/actions/tags"

type TagWithCount = {
  id: string
  name: string
  _count: { cards: number }
}


interface Props {
  tags: TagWithCount[]
}

export function TagsView({ tags }: Props) {
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
                href={`/tags/${tag.id}`}
                target="_blank"
                rel="noopener noreferrer"
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
