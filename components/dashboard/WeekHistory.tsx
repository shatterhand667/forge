import Link from "next/link"

interface DayEntry {
  date: Date
  status: "STARTED" | "MORNING" | "COMPLETED"
}

export interface WeekEntry {
  weekStart: string
  days: DayEntry[]
  weeklyReview: { status: "IN_PROGRESS" | "COMPLETED" } | null
}

interface WeekHistoryProps {
  weeks: WeekEntry[]
  currentPage: number
  totalPages: number
}

const STATUS_LABEL = {
  COMPLETED: "Ukończona",
  MORNING: "Sesja poranna",
  STARTED: "W trakcie",
}

const WR_STATUS_LABEL = {
  COMPLETED: "Ukończony",
  IN_PROGRESS: "W trakcie",
}

function formatWeekLabel(weekStart: string): string {
  const mon = new Date(weekStart + "T00:00:00Z")
  const sun = new Date(weekStart + "T00:00:00Z")
  sun.setUTCDate(sun.getUTCDate() + 6)
  const monDay = mon.getUTCDate()
  const sunDay = sun.getUTCDate()
  const monMonth = mon.toLocaleDateString("pl-PL", { month: "short", timeZone: "UTC" })
  const sunMonth = sun.toLocaleDateString("pl-PL", { month: "short", timeZone: "UTC" })
  const year = sun.getUTCFullYear()
  if (monMonth === sunMonth) return `${monDay}–${sunDay} ${monMonth} ${year}`
  return `${monDay} ${monMonth} – ${sunDay} ${sunMonth} ${year}`
}

export function WeekHistory({ weeks, currentPage, totalPages }: WeekHistoryProps) {
  if (weeks.length === 0) {
    return (
      <p style={{ color: "var(--color-muted)", fontSize: "var(--font-size-body)", fontStyle: "italic" }}>
        Brak poprzednich tygodni.
      </p>
    )
  }

  return (
    <div className="flex flex-col">
      {weeks.map((week) => {
        const label = formatWeekLabel(week.weekStart)
        const completedCount = week.days.filter((d) => d.status === "COMPLETED").length
        const sortedDays = [...week.days].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )

        return (
          <details key={week.weekStart}>
            <summary
              className="flex items-center justify-between py-2 cursor-pointer border-b"
              style={{ borderColor: "var(--color-border)", listStyle: "none" }}
            >
              <span style={{ fontSize: "var(--font-size-body)", color: "var(--color-text)" }}>
                {label}
              </span>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
                  {completedCount}/{week.days.length} kart
                </span>
                {week.weeklyReview && (
                  <span
                    style={{
                      fontSize: "var(--font-size-tiny)",
                      color:
                        week.weeklyReview.status === "COMPLETED"
                          ? "var(--color-mid)"
                          : "var(--color-gold)",
                    }}
                  >
                    Tygodniowa: {WR_STATUS_LABEL[week.weeklyReview.status]}
                  </span>
                )}
              </div>
            </summary>

            <div className="flex flex-col pl-3 pt-1 pb-3">
              {sortedDays.map((day) => {
                const dateStr = new Date(day.date).toISOString().split("T")[0]
                const displayDate = new Date(day.date).toLocaleDateString("pl-PL", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                  timeZone: "UTC",
                })
                const href =
                  day.status === "COMPLETED"
                    ? `/cards/${dateStr}/complete`
                    : day.status === "MORNING"
                    ? `/cards/${dateStr}/evening/6`
                    : `/cards/${dateStr}/morning/1`

                return (
                  <div
                    key={dateStr}
                    className="flex items-center justify-between py-1 border-b"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: "var(--font-size-body)", color: "var(--color-text)" }}>
                        {displayDate}
                      </span>
                      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
                        {STATUS_LABEL[day.status]}
                      </span>
                    </div>
                    <Link
                      href={href}
                      style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-mid)" }}
                    >
                      Podgląd
                    </Link>
                  </div>
                )
              })}

              <div
                className="flex items-center justify-between py-1"
                style={{ paddingTop: "6px" }}
              >
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: "var(--font-size-body)", color: "var(--color-text)" }}>
                    Przegląd tygodniowy
                  </span>
                  {week.weeklyReview && (
                    <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
                      {WR_STATUS_LABEL[week.weeklyReview.status]}
                    </span>
                  )}
                </div>
                <Link
                  href={
                    week.weeklyReview?.status === "COMPLETED"
                      ? `/weekly/${week.weekStart}/complete`
                      : `/weekly/${week.weekStart}/step/1`
                  }
                  style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-gold)" }}
                >
                  {week.weeklyReview ? "Podgląd" : "Rozpocznij"}
                </Link>
              </div>
            </div>
          </details>
        )
      })}

      {totalPages > 1 && (
        <div
          className="flex items-center justify-between pt-4"
          style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
        >
          {currentPage < totalPages ? (
            <Link href={`/?page=${currentPage + 1}`} style={{ color: "var(--color-mid)" }}>
              ← Starsze
            </Link>
          ) : (
            <span />
          )}
          <span>{currentPage} / {totalPages}</span>
          {currentPage > 1 ? (
            <Link href={`/?page=${currentPage - 1}`} style={{ color: "var(--color-mid)" }}>
              Nowsze →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  )
}
