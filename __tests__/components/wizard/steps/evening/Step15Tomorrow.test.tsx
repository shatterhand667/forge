import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
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
})
