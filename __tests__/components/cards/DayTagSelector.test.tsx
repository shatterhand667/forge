import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { DayTagSelector } from "@/components/cards/DayTagSelector"

vi.mock("@/actions/tags", () => ({
  setCardTags: vi.fn().mockResolvedValue(undefined),
}))

const allTags = [
  { id: "t1", name: "FOMO" },
  { id: "t2", name: "Skupiony" },
  { id: "t3", name: "Strach" },
  { id: "t4", name: "W strefie" },
]

describe("DayTagSelector", () => {
  it("renders all tag chips", () => {
    render(<DayTagSelector cardId="card1" allTags={allTags} initialTagIds={[]} />)
    expect(screen.getByText("FOMO")).toBeInTheDocument()
    expect(screen.getByText("Skupiony")).toBeInTheDocument()
  })

  it("shows initially selected tags as active", () => {
    render(<DayTagSelector cardId="card1" allTags={allTags} initialTagIds={["t1"]} />)
    const fomoBtn = screen.getByText("FOMO").closest("button")!
    expect(fomoBtn).toHaveStyle({ background: "#4A9EE2" })
  })

  it("toggles tag on click", () => {
    render(<DayTagSelector cardId="card1" allTags={allTags} initialTagIds={[]} />)
    fireEvent.click(screen.getByText("FOMO"))
    expect(screen.getByText("Wybrano: 1/3")).toBeInTheDocument()
  })

  it("does not allow selecting more than 3 tags", () => {
    render(<DayTagSelector cardId="card1" allTags={allTags} initialTagIds={["t1", "t2", "t3"]} />)
    fireEvent.click(screen.getByText("W strefie"))
    expect(screen.getByText("Wybrano: 3/3")).toBeInTheDocument()
  })

  it("shows empty state link when no tags", () => {
    render(<DayTagSelector cardId="card1" allTags={[]} initialTagIds={[]} />)
    expect(screen.getByText(/Dodaj tagi w zakładce Tagi/)).toBeInTheDocument()
  })
})
