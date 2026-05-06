import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Step1Lesson } from "@/components/wizard/steps/morning/Step1Lesson"

const baseCard = {
  id: "card-1",
  yesterdayLesson: "Czekaj na potwierdzenie setupu.",
  yesterdayMentorComment: null,
  lastWeekLesson: null,
  trades: [],
  emotionEntries: [],
} as any

describe("Step1Lesson - mentor comment", () => {
  it("does not render mentor comment block when null", () => {
    render(
      <Step1Lesson card={baseCard} date="2026-05-06" step={1} bridge2Items={[]} />
    )
    expect(screen.queryByText("KOMENTARZ MENTORA:")).not.toBeInTheDocument()
  })

  it("renders mentor comment block when present", () => {
    const card = { ...baseCard, yesterdayMentorComment: "Dobra dyscyplina ryzyka." }
    render(
      <Step1Lesson card={card} date="2026-05-06" step={1} bridge2Items={[]} />
    )
    expect(screen.getByText("KOMENTARZ MENTORA:")).toBeInTheDocument()
    expect(screen.getByText("Dobra dyscyplina ryzyka.")).toBeInTheDocument()
  })
})
