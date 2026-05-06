import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GoldCircles } from "@/components/forge/GoldCircles"

describe("GoldCircles", () => {
  it("renders 5 circles", () => {
    render(<GoldCircles label="Ogólna ocena:" value={null} onChange={vi.fn()} />)
    expect(screen.getAllByRole("radio")).toHaveLength(5)
  })

  it("fills circles up to selected value", () => {
    render(<GoldCircles label="Ogólna ocena:" value={3} onChange={vi.fn()} />)
    const radios = screen.getAllByRole("radio")
    expect(radios[2]).toBeChecked()
  })
})
