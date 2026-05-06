import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { TableInput } from "@/components/forge/TableInput"

const textColumns = [
  { id: "name", label: "Nazwa", type: "text" as const },
  { id: "notes", label: "Notatki", type: "textarea" as const },
]

const numberColumns = [
  { id: "val", label: "Wartość", type: "number" as const },
]

const rows = [{ name: "test", notes: "jakiś tekst", val: "2.5" }]

describe("TableInput", () => {
  it("renders textarea for textarea-type columns", () => {
    render(
      <TableInput columns={textColumns} rows={rows} onAddRow={vi.fn()} onUpdateRow={vi.fn()} />
    )
    expect(screen.getByDisplayValue("jakiś tekst").tagName).toBe("TEXTAREA")
  })

  it("renders input for text-type columns", () => {
    render(
      <TableInput columns={textColumns} rows={rows} onAddRow={vi.fn()} onUpdateRow={vi.fn()} />
    )
    expect(screen.getByDisplayValue("test").tagName).toBe("INPUT")
  })

  it("renders input with class no-spinner for number-type columns", () => {
    render(
      <TableInput columns={numberColumns} rows={[{ val: "2.5" }]} onAddRow={vi.fn()} onUpdateRow={vi.fn()} />
    )
    const input = screen.getByDisplayValue("2.5")
    expect(input).toHaveClass("no-spinner")
    expect(input).toHaveAttribute("type", "number")
  })
})
