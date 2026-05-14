import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOrCreateWeeklyReview, getWeeklyStats } from "@/actions/weekly"
import { WeeklyStep1Stats } from "@/components/weekly/steps/WeeklyStep1Stats"
import { WeeklyStep2Tiers } from "@/components/weekly/steps/WeeklyStep2Tiers"
import { WeeklyStep3EdgeTrend } from "@/components/weekly/steps/WeeklyStep3EdgeTrend"
import { WeeklyStep4Trades } from "@/components/weekly/steps/WeeklyStep4Trades"
import { WeeklyStep5Lessons } from "@/components/weekly/steps/WeeklyStep5Lessons"
import { WeeklyStep6Patterns } from "@/components/weekly/steps/WeeklyStep6Patterns"
import { WeeklyStep7Mental } from "@/components/weekly/steps/WeeklyStep7Mental"
import { WeeklyStep8Identity } from "@/components/weekly/steps/WeeklyStep8Identity"
import { WeeklyStep9Bridge } from "@/components/weekly/steps/WeeklyStep9Bridge"
import { WeeklyStep10Practice } from "@/components/weekly/steps/WeeklyStep10Practice"
import { WeeklyStep11Goal } from "@/components/weekly/steps/WeeklyStep11Goal"

const TOTAL_STEPS = 11

export default async function WeeklyStepPage({
  params,
}: {
  params: Promise<{ weekStart: string; step: string }>
}) {
  const { weekStart, step: stepStr } = await params
  const step = parseInt(stepStr)
  if (isNaN(step) || step < 1 || step > TOTAL_STEPS) {
    redirect(`/weekly/${weekStart}/step/1`)
  }

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [review, stats] = await Promise.all([
    getOrCreateWeeklyReview(weekStart),
    getWeeklyStats(weekStart),
  ])

  const props = { review, stats, weekStart, step }

  if (step === 1) return <WeeklyStep1Stats {...props} />
  if (step === 2) return <WeeklyStep2Tiers {...props} />
  if (step === 3) return <WeeklyStep3EdgeTrend {...props} edgeTrend={[]} />
  if (step === 4) return <WeeklyStep4Trades {...props} />
  if (step === 5) return <WeeklyStep5Lessons {...props} />
  if (step === 6) return <WeeklyStep6Patterns {...props} />
  if (step === 7) return <WeeklyStep7Mental {...props} />
  if (step === 8) return <WeeklyStep8Identity {...props} />
  if (step === 9) return <WeeklyStep9Bridge {...props} />
  if (step === 10) return <WeeklyStep10Practice {...props} />
  return <WeeklyStep11Goal {...props} />
}
