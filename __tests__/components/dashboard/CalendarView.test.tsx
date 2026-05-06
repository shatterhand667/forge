import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { CalendarView } from "@/components/dashboard/CalendarView"

const cards = [
  { date: new Date("2026-05-04"), status: "COMPLETED" as const },
  { date: new Date("2026-05-05"), status: "MORNING" as const },
]

describe("CalendarView", () => {
  it("renders all days of the month", () => {
    render(<CalendarView year={2026} month={5} cards={cards} />)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("31")).toBeInTheDocument()
  })

  it("shows completed indicator for days with completed card", () => {
    render(<CalendarView year={2026} month={5} cards={cards} />)
    const day4 = screen.getByTestId("day-2026-05-04")
    expect(day4).toHaveAttribute("data-status", "COMPLETED")
  })

  it("shows morning indicator for days with morning-only card", () => {
    render(<CalendarView year={2026} month={5} cards={cards} />)
    const day5 = screen.getByTestId("day-2026-05-05")
    expect(day5).toHaveAttribute("data-status", "MORNING")
  })
})
