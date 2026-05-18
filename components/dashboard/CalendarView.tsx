"use client"

import { useState } from "react"
import Link from "next/link"

interface CalendarCard {
  date: Date
  status: "STARTED" | "MORNING" | "COMPLETED"
}

interface CalendarViewProps {
  initialYear: number
  initialMonth: number
  allCards: CalendarCard[]
  weeklyReviews: Record<string, "IN_PROGRESS" | "COMPLETED">
}

const DAY_LABELS = ["Pn", "Wt", "Śr", "Czw", "Pt", "Sb", "Nd"]

const STATUS_COLORS = {
  COMPLETED: "var(--color-mid)",
  MORNING: "var(--color-gold)",
  STARTED: "var(--color-gold)",
}

const WEEKLY_COLORS = {
  COMPLETED: "#2D6A4F",
  IN_PROGRESS: "#D96060",
}

export function CalendarView({ initialYear, initialMonth, allCards, weeklyReviews }: CalendarViewProps) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)

  function goToPrev() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12) }
    else setMonth((m) => m - 1)
  }

  function goToNext() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1) }
    else setMonth((m) => m + 1)
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayRaw = new Date(year, month - 1, 1).getDay()
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1

  const cardMap = new Map(
    allCards
      .filter((c) => {
        const d = new Date(c.date)
        return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month
      })
      .map((c) => [new Date(c.date).toISOString().split("T")[0], c.status])
  )

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const monthLabel = new Date(year, month - 1).toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPrev}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 6px",
            color: "var(--color-muted)",
            fontSize: "var(--font-size-body)",
          }}
        >
          ←
        </button>
        <h3
          className="font-bold uppercase tracking-wide"
          style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
        >
          {monthLabel}
        </h3>
        <button
          onClick={goToNext}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 6px",
            color: "var(--color-muted)",
            fontSize: "var(--font-size-body)",
          }}
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center"
            style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const status = cardMap.get(dateStr)

          const dateObj = new Date(year, month - 1, day)
          const dow = dateObj.getDay()
          const isWeekend = dow === 0 || dow === 6

          let href: string
          let weekStart: string | null = null

          if (isWeekend) {
            const daysFromMon = dow === 0 ? 6 : 5
            const mon = new Date(dateObj)
            mon.setDate(mon.getDate() - daysFromMon)
            weekStart = `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`
            const wrStatus = weeklyReviews[weekStart]
            href = wrStatus === "COMPLETED"
              ? `/weekly/${weekStart}/complete`
              : `/weekly/${weekStart}/step/1`
          } else {
            href =
              status === "COMPLETED"
                ? `/cards/${dateStr}/complete`
                : status === "MORNING"
                ? `/cards/${dateStr}/evening/6`
                : `/cards/${dateStr}/morning/1`
          }

          const weeklyStatus = weekStart ? weeklyReviews[weekStart] : undefined
          const background = isWeekend
            ? weeklyStatus ? WEEKLY_COLORS[weeklyStatus] : "var(--color-border)"
            : status ? STATUS_COLORS[status] : "var(--color-light)"
          const textColor = (isWeekend && weeklyStatus) || (!isWeekend && status)
            ? "var(--color-white)"
            : "var(--color-text)"

          return (
            <Link
              key={dateStr}
              href={href}
              data-testid={`day-${dateStr}`}
              data-status={status ?? "none"}
              className="flex items-center justify-center rounded aspect-square text-center"
              style={{
                fontSize: "var(--font-size-tiny)",
                background,
                color: textColor,
              }}
            >
              {day}
            </Link>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {[
          { color: "var(--color-mid)", label: "Dzienna ukończona" },
          { color: "var(--color-gold)", label: "Sesja poranna" },
          { color: "var(--color-light)", label: "Brak karty" },
          { color: "#2D6A4F", label: "Tygodniowy ukończony" },
          { color: "#D96060", label: "Tygodniowy w trakcie" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
