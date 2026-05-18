"use client"

import { useState, useTransition } from "react"
import { evaluateGoal } from "@/actions/calibration"

type Goal = {
  id: string
  goalText: string
  probabilityAssigned: number
  setAt: Date
  sourceId: string | null
  outcome: string | null
}

export function CalibrationBanner({ goal }: { goal: Goal }) {
  const [outcome, setOutcome] = useState<string | null>(goal.outcome)
  const [, startTransition] = useTransition()

  function handle(result: "achieved" | "not_achieved") {
    setOutcome(result)
    startTransition(() => evaluateGoal(goal.id, result))
  }

  const weekLabel = goal.sourceId
    ? (() => {
        const parts = goal.sourceId.split("-").map(Number)
        const [y, m, d] = parts
        const fri = new Date(Date.UTC(y, m - 1, d + 4))
        return `${d}.${String(m).padStart(2, "0")}–${fri.getUTCDate()}.${String(fri.getUTCMonth() + 1).padStart(2, "0")}`
      })()
    : null

  const accentColor = outcome === "achieved" ? "#2D6A4F" : outcome === "not_achieved" ? "#D96060" : "#2D6A4F"

  return (
    <div
      className="rounded px-4 py-3"
      style={{ background: "var(--color-light)", borderLeft: `4px solid ${accentColor}` }}
    >
      <p
        className="font-medium mb-1"
        style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}
      >
        Cel tygodniowy{weekLabel ? ` (${weekLabel})` : ""} — czy osiągnięty?
      </p>
      <div className="flex items-center justify-between gap-4 mt-1">
        <p style={{ fontSize: "var(--font-size-body)", color: "var(--color-text)", flex: 1 }}>
          {goal.goalText}
          <span style={{ color: "var(--color-muted)", fontSize: "var(--font-size-tiny)", marginLeft: 8 }}>
            ({goal.probabilityAssigned}%)
          </span>
        </p>
        {outcome === null ? (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => handle("achieved")}
              style={{
                fontSize: "var(--font-size-tiny)", padding: "3px 12px", borderRadius: 4,
                border: "1px solid #2D6A4F", background: "#2D6A4F", color: "#fff", cursor: "pointer",
              }}
            >
              Tak
            </button>
            <button
              onClick={() => handle("not_achieved")}
              style={{
                fontSize: "var(--font-size-tiny)", padding: "3px 12px", borderRadius: 4,
                border: "1px solid #D96060", background: "#D96060", color: "#fff", cursor: "pointer",
              }}
            >
              Nie
            </button>
          </div>
        ) : (
          <span
            style={{
              fontSize: "var(--font-size-tiny)", padding: "3px 12px", borderRadius: 4,
              background: accentColor, color: "#fff", fontWeight: 700, flexShrink: 0,
            }}
          >
            {outcome === "achieved" ? "Osiągnięty ✓" : "Nie osiągnięty ✗"}
          </span>
        )}
      </div>
    </div>
  )
}
