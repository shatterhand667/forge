import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DotRow } from "@/components/forge/DotRow"

describe("DotRow", () => {
  it("renders label and 5 numbered options", () => {
    render(<DotRow label="Sen:" value={null} onChange={vi.fn()} />)
    expect(screen.getByText("Sen:")).toBeInTheDocument()
    expect(screen.getAllByRole("radio")).toHaveLength(5)
    ;[1, 2, 3, 4, 5].forEach((n) => {
      expect(screen.getByLabelText(String(n))).toBeInTheDocument()
    })
  })

  it("marks the current value as checked", () => {
    render(<DotRow label="Sen:" value={3} onChange={vi.fn()} />)
    expect(screen.getByLabelText("3")).toBeChecked()
    expect(screen.getByLabelText("1")).not.toBeChecked()
  })

  it("calls onChange with numeric value on click", async () => {
    const onChange = vi.fn()
    render(<DotRow label="Sen:" value={null} onChange={onChange} />)
    await userEvent.click(screen.getByLabelText("4"))
    expect(onChange).toHaveBeenCalledWith(4)
  })
})
