"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, DotRow, TextArea } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import type { DailyCard } from "@prisma/client"

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: any[] }
  date: string
  step: number
}

function getBodyZone(score: number): { zone: 1 | 2 | 3; color: string; text: string } {
  if (score <= 7)  return { zone: 1, color: "#CC3333", text: "Dziś nie tradujesz" }
  if (score <= 14) return { zone: 2, color: "#E07B2A", text: "Dziś ryzyko max. 50%" }
  return           { zone: 3, color: "#3D9B47", text: "Jesteś gotowy" }
}

function ReadOnlyScoreDots({ zone, color }: { zone: 1 | 2 | 3; color: string }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {[1, 2, 3].map(n => {
        const filled = zone >= n
        return (
          <span
            key={n}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              border: `1.5px solid ${filled ? color : "#CCCCCC"}`,
              background: filled ? color : "transparent",
              display: "inline-block",
              transition: "all 150ms ease",
            }}
          />
        )
      })}
    </div>
  )
}

export function Step2PersonalContext({ card, date, step }: Props) {
  const router = useRouter()
  const [sleep, setSleep] = useState<number | null>(card.sleep)
  const [energy, setEnergy] = useState<number | null>(card.energy)
  const [focus, setFocus] = useState<number | null>(card.focus)
  const [prepQuality, setPrepQuality] = useState<number | null>(card.prepQuality)
  const [moodNotes, setMoodNotes] = useState(card.moodNotes ?? "")
  const [saving, setSaving] = useState(false)

  const bodyScore = (sleep != null && energy != null) ? sleep + energy : null
  const bodyZone = bodyScore !== null ? getBodyZone(bodyScore) : null

  async function handleNext() {
    setSaving(true)
    await updateDailyCard(card.id, {
      sleep: sleep ?? undefined,
      energy: energy ?? undefined,
      focus: focus ?? undefined,
      prepQuality: prepQuality ?? undefined,
      moodNotes,
    })
    router.push(`/cards/${date}/morning/3`)
  }

  return (
    <WizardLayout
      date={date}
      session="morning"
      currentStep={step}
      totalSteps={15}
      stepLabel="Kontekst osobisty"
      prevHref={`/cards/${date}/morning/1`}
      onNext={handleNext}
      nextDisabled={saving}
      nextLabel={saving ? "Zapisuję..." : "Dalej →"}
      lesson={card.yesterdayLesson}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="1" title="KONTEKST OSOBISTY (RANO)" />
        <div className="flex flex-col gap-1 py-2">
          <DotRow label="Sen:" value={sleep} onChange={setSleep} labelWidth="170px" options={[1,2,3,4,5,6,7,8,9,10]} />
          <DotRow label="Energia:" value={energy} onChange={setEnergy} labelWidth="170px" options={[1,2,3,4,5,6,7,8,9,10]} />
          <DotRow label="Fokus:" value={focus} onChange={setFocus} labelWidth="170px" options={[1,2,3,4,5,6,7,8,9,10]} />
          <DotRow label="Jakość przygotowania:" value={prepQuality} onChange={setPrepQuality} labelWidth="170px" options={[1,2,3,4,5,6,7,8,9,10]} />

          {bodyZone && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: "170px", maxWidth: "170px" }}>
                  <span style={{ color: "var(--color-muted)", fontSize: "var(--font-size-label)", whiteSpace: "nowrap" }}>
                    Body Aggregation:
                  </span>
                  <div style={{ position: "relative", display: "inline-flex" }} className="group">
                    <span style={{ fontSize: 10, color: "var(--color-muted)", cursor: "default", userSelect: "none" }}>ⓘ</span>
                    <div className="group-hover:block hidden" style={{
                      position: "absolute",
                      bottom: "calc(100% + 6px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "var(--color-dark)",
                      color: "var(--color-white)",
                      fontSize: "var(--font-size-tiny)",
                      padding: "6px 10px",
                      borderRadius: 4,
                      width: 220,
                      zIndex: 10,
                      lineHeight: 1.5,
                      pointerEvents: "none",
                    }}>
                      Suma ocen Sen + Energia (maks. 20). Wskaźnik gotowości biologicznej. ≤7 = układ nerwowy nie uniesie stresu dużych pozycji. 8–14 = ogranicz ryzyko. 15–20 = pełna gotowość.
                    </div>
                  </div>
                </div>
                <ReadOnlyScoreDots zone={bodyZone.zone} color={bodyZone.color} />
              </div>
              <span style={{
                fontSize: "var(--font-size-tiny)",
                color: bodyZone.color,
                fontStyle: "italic",
                paddingLeft: "178px",
              }}>
                {bodyZone.text}
              </span>
            </div>
          )}
        </div>
        <TextArea label="Nastrój / notatki:" value={moodNotes} onChange={setMoodNotes} rows={5} />
      </div>
    </WizardLayout>
  )
}
