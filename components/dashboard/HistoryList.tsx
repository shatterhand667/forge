import Link from "next/link"

interface CardSummary {
  date: Date
  status: "MORNING" | "COMPLETED"
}

interface HistoryListProps {
  cards: CardSummary[]
}

const STATUS_LABEL = {
  COMPLETED: "Ukończona",
  MORNING: "Sesja poranna",
}

export function HistoryList({ cards }: HistoryListProps) {
  if (cards.length === 0) {
    return (
      <p style={{ color: "var(--color-muted)", fontSize: "var(--font-size-body)", fontStyle: "italic" }}>
        Brak poprzednich kart.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {cards.map((card) => {
        const dateStr = new Date(card.date).toISOString().split("T")[0]
        const displayDate = new Date(card.date).toLocaleDateString("pl-PL", {
          weekday: "short", day: "2-digit", month: "2-digit",
        })

        return (
          <li
            key={dateStr}
            className="flex items-center justify-between py-2 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: "var(--font-size-body)", color: "var(--color-text)" }}>
                {displayDate}
              </span>
              <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
                {STATUS_LABEL[card.status]}
              </span>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/cards/${dateStr}/morning/1`}
                style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-mid)" }}
              >
                Podgląd
              </Link>
              {card.status === "COMPLETED" && (
                <a
                  href={`/api/cards/${dateStr}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-gold)" }}
                >
                  PDF
                </a>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
