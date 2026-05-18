import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { CalendarView } from "@/components/dashboard/CalendarView"

const allCards = [
  { date: new Date("2026-05-04"), status: "COMPLETED" as const },
  { date: new Date("2026-05-05"), status: "MORNING" as const },
]

const weeklyReviews = { "2026-04-27": "COMPLETED" as const }

describe("CalendarView", () => {
  it("renders all days of the month", () => {
    render(<CalendarView initialYear={2026} initialMonth={5} allCards={allCards} weeklyReviews={weeklyReviews} />)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("31")).toBeInTheDocument()
  })

  it("shows completed indicator for days with completed card", () => {
    render(<CalendarView initialYear={2026} initialMonth={5} allCards={allCards} weeklyReviews={weeklyReviews} />)
    const day4 = screen.getByTestId("day-2026-05-04")
    expect(day4).toHaveAttribute("data-status", "COMPLETED")
  })

  it("shows morning indicator for days with morning-only card", () => {
    render(<CalendarView initialYear={2026} initialMonth={5} allCards={allCards} weeklyReviews={weeklyReviews} />)
    const day5 = screen.getByTestId("day-2026-05-05")
    expect(day5).toHaveAttribute("data-status", "MORNING")
  })
})
