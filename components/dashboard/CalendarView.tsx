import Link from "next/link"

interface CalendarCard {
  date: Date
  status: "STARTED" | "MORNING" | "COMPLETED"
}

interface CalendarViewProps {
  year: number
  month: number
  cards: CalendarCard[]
}

const DAY_LABELS = ["Pn", "Wt", "Śr", "Czw", "Pt", "Sb", "Nd"]

const STATUS_COLORS = {
  COMPLETED: "var(--color-mid)",
  MORNING: "var(--color-gold)",
  STARTED: "var(--color-gold)",
}

export function CalendarView({ year, month, cards }: CalendarViewProps) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayRaw = new Date(year, month - 1, 1).getDay()
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1

  const cardMap = new Map(
    cards.map((c) => [
      new Date(c.date).toISOString().split("T")[0],
      c.status,
    ])
  )

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      <h3
        className="mb-3 font-bold uppercase tracking-wide"
        style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
      >
        {new Date(year, month - 1).toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
      </h3>

      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center" style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const status = cardMap.get(dateStr)

          const href =
            status === "COMPLETED"
              ? `/cards/${dateStr}/complete`
              : status === "MORNING"
              ? `/cards/${dateStr}/evening/6`
              : `/cards/${dateStr}/morning/1` // STARTED or no card

          return (
            <Link
              key={dateStr}
              href={href}
              data-testid={`day-${dateStr}`}
              data-status={status ?? "none"}
              className="flex items-center justify-center rounded aspect-square text-center"
              style={{
                fontSize: "var(--font-size-tiny)",
                background: status ? STATUS_COLORS[status] : "var(--color-light)",
                color: status ? "var(--color-white)" : "var(--color-text)",
              }}
            >
              {day}
            </Link>
          )
        })}
      </div>

      <div className="flex gap-4 mt-3">
        {[
          { color: "var(--color-mid)", label: "Ukończona" },
          { color: "var(--color-gold)", label: "Sesja poranna" },
          { color: "var(--color-light)", label: "Brak karty" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
