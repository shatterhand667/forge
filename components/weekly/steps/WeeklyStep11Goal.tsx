"use client"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

export function WeeklyStep11Goal({ review, weekStart, step }: Props) {
  return (
    <WeeklyLayout weekStart={weekStart} currentStep={step} totalSteps={11} stepLabel="Cel + Mentor + Stop-loss"
      prevHref={`/weekly/${weekStart}/step/10`} nextHref={`/weekly/${weekStart}/complete`}
      nextLabel="Zakończ przegląd →"
      lastWeekGoalRecap={review.lastWeekGoalRecap}>
      <p style={{ color: "var(--color-muted)" }}>— wkrótce —</p>
    </WeeklyLayout>
  )
}
