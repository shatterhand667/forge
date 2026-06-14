import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { TagsView } from "@/components/dashboard/TagsView"

vi.mock("@/actions/tags", () => ({
  createTag: vi.fn().mockResolvedValue(undefined),
  deleteTag: vi.fn().mockResolvedValue(undefined),
}))

const tags = [
  { id: "t1", name: "FOMO", _count: { cards: 7 } },
  { id: "t2", name: "Skupiony", _count: { cards: 12 } },
]

describe("TagsView list", () => {
  it("renders tags alphabetically with counts", () => {
    render(<TagsView tags={tags} selectedTag={null} />)
    expect(screen.getByText("FOMO")).toBeInTheDocument()
    expect(screen.getByText("7 dni")).toBeInTheDocument()
    expect(screen.getByText("Skupiony")).toBeInTheDocument()
    expect(screen.getByText("12 dni")).toBeInTheDocument()
  })

  it("renders add input and button", () => {
    render(<TagsView tags={tags} selectedTag={null} />)
    expect(screen.getByPlaceholderText("Nazwa tagu...")).toBeInTheDocument()
    expect(screen.getByText("Dodaj")).toBeInTheDocument()
  })
})

describe("TagsView detail", () => {
  const selectedTag = {
    id: "t1",
    name: "FOMO",
    cards: [
      {
        dailyCard: {
          date: new Date("2026-06-10"),
          processScore: 7,
          trades: [{ profitRaw: 120 }],
        },
      },
    ],
  }

  it("renders back link and tag name", () => {
    render(<TagsView tags={tags} selectedTag={selectedTag} />)
    expect(screen.getByText("← Wszystkie tagi")).toBeInTheDocument()
    expect(screen.getByText(/FOMO/)).toBeInTheDocument()
  })

  it("renders card row with date, pnl and score", () => {
    render(<TagsView tags={tags} selectedTag={selectedTag} />)
    expect(screen.getByText("10.06.2026")).toBeInTheDocument()
    expect(screen.getByText("+€120")).toBeInTheDocument()
    expect(screen.getByText("7/10")).toBeInTheDocument()
  })

  it("shows empty state when no cards", () => {
    render(<TagsView tags={tags} selectedTag={{ id: "t1", name: "FOMO", cards: [] }} />)
    expect(screen.getByText("Brak dni z tym tagiem.")).toBeInTheDocument()
  })
})
