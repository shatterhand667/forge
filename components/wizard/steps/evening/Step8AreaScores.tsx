"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, DotRow } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import type { DailyCard } from "@prisma/client"

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: any[] }
  date: string
  step: number
}

export function Step8AreaScores({ card, date, step }: Props) {
  const router = useRouter()
  const [setups, setSetups] = useState<number | null>(card.setupsScore)
  const [execution, setExecution] = useState<number | null>(card.executionScore)
  const [riskManagement, setRiskManagement] = useState<number | null>(card.riskScore)
  const [psychology, setPsychology] = useState<number | null>(card.psychologyScore)
  const [discipline, setDiscipline] = useState<number | null>(card.disciplineScore)
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateDailyCard(card.id, {
      setupsScore: setups ?? undefined,
      executionScore: execution ?? undefined,
      riskScore: riskManagement ?? undefined,
      psychologyScore: psychology ?? undefined,
      disciplineScore: discipline ?? undefined,
    })
    router.push(`/cards/${date}/evening/9`)
  }

  return (
    <WizardLayout
      date={date}
      session="evening"
      currentStep={step}
      totalSteps={15}
      stepLabel="Oceny obszarów"
      prevHref={`/cards/${date}/evening/7`}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="7" title="OCENY OBSZARÓW" />
        <div className="flex flex-col gap-1 py-2">
          <DotRow label="Setupy:" value={setups} onChange={setSetups} />
          <DotRow label="Egzekucja:" value={execution} onChange={setExecution} />
          <DotRow label="Zarządzanie ryzykiem:" value={riskManagement} onChange={setRiskManagement} />
          <DotRow label="Psychologia:" value={psychology} onChange={setPsychology} />
          <DotRow label="Dyscyplina:" value={discipline} onChange={setDiscipline} />
        </div>
        <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", fontStyle: "italic" }}>
          1 = naruszenie zasad · 3 = poprawnie ale automatycznie · 5 = świadomie i zgodnie z planem
        </p>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 border-t"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div
          className="mx-auto px-4 py-3 flex justify-between"
          style={{ maxWidth: "var(--content-max-width)" }}
        >
          <a href={`/cards/${date}/evening/7`} style={{ color: "var(--color-muted)", fontSize: 14 }}>
            ← Wstecz
          </a>
          <button
            onClick={handleNext}
            disabled={saving}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ background: "var(--color-mid)", color: "var(--color-white)" }}
          >
            {saving ? "Zapisuję..." : "Dalej →"}
          </button>
        </div>
      </div>
    </WizardLayout>
  )
}
