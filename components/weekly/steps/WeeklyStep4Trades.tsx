"use client"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

export function WeeklyStep4Trades({ review, weekStart, step }: Props) {
  return (
    <WeeklyLayout weekStart={weekStart} currentStep={step} totalSteps={11} stepLabel="Najlepszy/najgorszy trade"
      prevHref={`/weekly/${weekStart}/step/3`} nextHref={`/weekly/${weekStart}/step/5`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}>
      <p style={{ color: "var(--color-muted)" }}>— wkrótce —</p>
    </WeeklyLayout>
  )
}
