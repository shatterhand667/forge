import { redirect } from "next/navigation"
import { getDailyCard } from "@/actions/cards"
import { getPlaybookSetups } from "@/actions/playbook"
import { getPrevWeekGoal } from "@/actions/calibration"
import { Step6TradeLog } from "@/components/wizard/steps/evening/Step6TradeLog"
import { Step7EmotionLog } from "@/components/wizard/steps/evening/Step7EmotionLog"
import { Step8AreaScores } from "@/components/wizard/steps/evening/Step8AreaScores"
import { Step9Strengths } from "@/components/wizard/steps/evening/Step9Strengths"
import { Step10Implementation } from "@/components/wizard/steps/evening/Step10Implementation"
import { Step11MentalState } from "@/components/wizard/steps/evening/Step11MentalState"
import { Step12Practice } from "@/components/wizard/steps/evening/Step12Practice"
import { Step13Evaluation } from "@/components/wizard/steps/evening/Step13Evaluation"
import { Step14Identity } from "@/components/wizard/steps/evening/Step14Identity"
import { Step15Tomorrow } from "@/components/wizard/steps/evening/Step15Tomorrow"

const STEP_COMPONENTS = {
  7: Step7EmotionLog,
  8: Step8AreaScores,
  9: Step9Strengths,
  10: Step10Implementation,
  11: Step11MentalState,
  12: Step12Practice,
  13: Step13Evaluation,
  14: Step14Identity,
  15: Step15Tomorrow,
}

export default async function EveningStepPage({
  params,
}: {
  params: Promise<{ date: string; step: string }>
}) {
  const { date, step: stepStr } = await params
  const step = parseInt(stepStr)
  if (step < 6 || step > 15 || isNaN(step)) redirect(`/cards/${date}/evening/6`)

  const card = await getDailyCard(date)
  if (!card) redirect(`/cards/${date}/morning/1`)

  if (step === 6) {
    const playbookSetups = await getPlaybookSetups()
    return <Step6TradeLog card={card} date={date} step={step} playbookSetups={playbookSetups} />
  }

  if (step === 13) {
    const [y, m, d2] = date.split("-").map(Number)
    const dow = new Date(Date.UTC(y, m - 1, d2)).getUTCDay()
    const daysFromMon = dow === 0 ? 6 : dow - 1
    const mon = new Date(Date.UTC(y, m - 1, d2 - daysFromMon))
    const weekStartStr = `${mon.getUTCFullYear()}-${String(mon.getUTCMonth() + 1).padStart(2, "0")}-${String(mon.getUTCDate()).padStart(2, "0")}`
    const weeklyGoal = await getPrevWeekGoal(weekStartStr)
    return <Step13Evaluation card={card} date={date} step={step} weeklyGoal={weeklyGoal} />
  }

  const StepComponent = STEP_COMPONENTS[step as keyof typeof STEP_COMPONENTS]
  return <StepComponent card={card} date={date} step={step} />
}
