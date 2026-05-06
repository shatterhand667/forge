import { redirect } from "next/navigation"
import { getOrCreateDailyCard } from "@/actions/cards"
import { getBridge2Items } from "@/lib/bridges"
import { auth } from "@/auth"
import { Step1Lesson } from "@/components/wizard/steps/morning/Step1Lesson"
import { Step2PersonalContext } from "@/components/wizard/steps/morning/Step2PersonalContext"
import { Step3MarketContext } from "@/components/wizard/steps/morning/Step3MarketContext"
import { Step4DailyPlan } from "@/components/wizard/steps/morning/Step4DailyPlan"
import { Step5PreMortem } from "@/components/wizard/steps/morning/Step5PreMortem"

const STEP_COMPONENTS = {
  1: Step1Lesson,
  2: Step2PersonalContext,
  3: Step3MarketContext,
  4: Step4DailyPlan,
  5: Step5PreMortem,
}

export default async function MorningStepPage({
  params,
}: {
  params: Promise<{ date: string; step: string }>
}) {
  const { date, step: stepStr } = await params
  const step = parseInt(stepStr)
  if (step < 1 || step > 5 || isNaN(step)) redirect(`/cards/${date}/morning/1`)

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const card = await getOrCreateDailyCard(date)
  const bridge2Items = step === 5
    ? await getBridge2Items(session.user.id, new Date(date))
    : []

  const StepComponent = STEP_COMPONENTS[step as keyof typeof STEP_COMPONENTS]

  return (
    <StepComponent
      card={card}
      date={date}
      step={step}
      bridge2Items={bridge2Items}
    />
  )
}
