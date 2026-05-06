"use client"

import { useState } from "react"
import { updateMentorComment } from "@/actions/cards"

interface Props {
  cardId: string
  initialComment: string | null
}

export function MentorCommentForm({ cardId, initialComment }: Props) {
  const [value, setValue] = useState(initialComment ?? "")
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  async function handleSave() {
    setSaving(true)
    setError(false)
    try {
      await updateMentorComment(cardId, value)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full" style={{ maxWidth: 300 }}>
      <label
        htmlFor="mentor-comment-textarea"
        className="font-medium uppercase tracking-wide"
        style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
      >
        Komentarz mentora
      </label>
      <textarea
        id="mentor-comment-textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        placeholder="Wpisz komentarz mentora po sesji feedbackowej..."
        className="w-full rounded px-3 py-2 resize-none"
        style={{
          border: `1px solid ${error ? "var(--color-gold)" : "var(--color-border)"}`,
          fontSize: "var(--font-size-body)",
          color: "var(--color-text)",
          background: "var(--color-white)",
        }}
      />
      {error && (
        <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-gold)" }}>
          Nie udało się zapisać. Spróbuj ponownie.
        </p>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 rounded font-medium"
        style={{
          background: saving ? "var(--color-border)" : "var(--color-mid)",
          color: "var(--color-white)",
          fontSize: "var(--font-size-tiny)",
          cursor: saving ? "not-allowed" : "pointer",
          border: "none",
          alignSelf: "flex-end",
        }}
      >
        {saved ? "Zapisano" : saving ? "Zapisuję..." : "Zapisz komentarz"}
      </button>
    </div>
  )
}
