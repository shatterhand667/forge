import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Step15Tomorrow } from "@/components/wizard/steps/evening/Step15Tomorrow"

const baseCard = {
  id: "card-1",
  tomorrowRemember: "",
  todayInOneSentence: null,
  trades: [],
  emotionEntries: [],
} as any

describe("Step15Tomorrow - todayInOneSentence", () => {
  it("renders the 'Dziś w jednym zdaniu' field", () => {
    render(<Step15Tomorrow card={baseCard} date="2026-05-07" step={15} />)
    expect(screen.getByText("Dziś w jednym zdaniu:")).toBeInTheDocument()
  })

  it("pre-fills the field when card has value", () => {
    const card = { ...baseCard, todayInOneSentence: "Dobry dzień, czekałem na setup." }
    render(<Step15Tomorrow card={card} date="2026-05-07" step={15} />)
    expect(screen.getByDisplayValue("Dobry dzień, czekałem na setup.")).toBeInTheDocument()
  })

  it("saves todayInOneSentence when finishing", async () => {
    const { updateDailyCard } = await import("@/actions/cards")
    const mockFn = updateDailyCard as ReturnType<typeof vi.fn>
    mockFn.mockClear()

    render(<Step15Tomorrow card={baseCard} date="2026-05-07" step={15} />)

    const input = screen.getByPlaceholderText("Jak opisałbyś ten dzień w jednym zdaniu?")
    fireEvent.change(input, { target: { value: "Skupiony i cierpliwy." } })

    const button = screen.getByText("Zakończ dzień")
    await userEvent.click(button)

    expect(mockFn).toHaveBeenCalledWith(
      "card-1",
      expect.objectContaining({ todayInOneSentence: "Skupiony i cierpliwy." })
    )
  })
})
