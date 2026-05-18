"use client"

import { useState } from "react"

type DailyEntry = { date: string; achieved: boolean }

type Goal = {
  id: string
  goalText: string
  probabilityAssigned: number
  setAt: Date
  sourceId: string | null
  outcome: string | null
  dailyOutcomes: unknown
  outcomeScore: number | null
}

export function CalibrationBanner({ goal }: { goal: Goal }) {
  const weekLabel = goal.sourceId
    ? (() => {
        const parts = goal.sourceId.split("-").map(Number)
        const [y, m, d] = parts
        const fri = new Date(Date.UTC(y, m - 1, d + 4))
        return `${d}.${String(m).padStart(2, "0")}–${fri.getUTCDate()}.${String(fri.getUTCMonth() + 1).padStart(2, "0")}`
      })()
    : null

  const daily = Array.isArray(goal.dailyOutcomes) ? (goal.dailyOutcomes as DailyEntry[]) : []
  const score = goal.outcomeScore
  const filledDays = daily.length
  const achievedDays = daily.filter((d) => d.achieved).length

  const weekDays = goal.sourceId
    ? (() => {
        const [y, m, d2] = goal.sourceId.split("-").map(Number)
        return Array.from({ length: 5 }, (_, i) => {
          const dt = new Date(Date.UTC(y, m - 1, d2 + 7 + i))
          return dt.toISOString().split("T")[0]
        })
      })()
    : []

  const accentColor = score !== null ? (score >= 0.5 ? "#2D6A4F" : "#D96060") : "#2D6A4F"

  return (
    <div
      className="rounded px-4 py-3"
      style={{ background: "var(--color-light)", borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div style={{ flex: 1 }}>
          <p
            className="font-medium mb-1"
            style={{ fontSize: 9, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}
          >
            Cel tygodniowy{weekLabel ? ` (${weekLabel})` : ""}
          </p>
          <p style={{ fontSize: "var(--font-size-body)", color: "var(--color-text)" }}>
            {goal.goalText}
            <span style={{ color: "var(--color-muted)", fontSize: "var(--font-size-tiny)", marginLeft: 8 }}>
              ({goal.probabilityAssigned}%)
            </span>
          </p>
        </div>
        {score !== null && (
          <span style={{
            fontSize: "var(--font-size-tiny)", padding: "3px 10px", borderRadius: 4,
            background: accentColor, color: "#fff", fontWeight: 700, flexShrink: 0, alignSelf: "center",
          }}>
            {Math.round(score * 100)}%
          </span>
        )}
      </div>

      {weekDays.length > 0 && (
        <div className="flex items-center gap-3 mt-3">
          {weekDays.map((dateStr, i) => {
            const entry = daily.find((d) => d.date === dateStr)
            const dayLabels = ["Pn", "Wt", "Śr", "Cz", "Pt"]
            const color = entry === undefined ? "var(--color-border)" : entry.achieved ? "#2D6A4F" : "#D96060"
            return (
              <div key={dateStr} className="flex items-center gap-1">
                <span style={{ fontSize: 9, color: "var(--color-muted)" }}>{dayLabels[i]}</span>
                <span style={{
                  display: "block", width: 9, height: 9, borderRadius: "50%",
                  background: color, flexShrink: 0,
                }} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
