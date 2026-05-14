"use client"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

export function WeeklyStep6Patterns({ review, weekStart, step }: Props) {
  return (
    <WeeklyLayout weekStart={weekStart} currentStep={step} totalSteps={11} stepLabel="Wzorce + błędy"
      prevHref={`/weekly/${weekStart}/step/5`} nextHref={`/weekly/${weekStart}/step/7`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}>
      <p style={{ color: "var(--color-muted)" }}>— wkrótce —</p>
    </WeeklyLayout>
  )
}
