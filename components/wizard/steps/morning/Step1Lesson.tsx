"use client"

import { WizardLayout } from "@/components/wizard/WizardLayout"
import { BridgeIndicator } from "@/components/forge"
import type { DailyCard } from "@prisma/client"

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: any[] }
  date: string
  step: number
  bridge2Items: string[]
}

export function Step1Lesson({ card, date, step, bridge2Items }: Props) {
  return (
    <WizardLayout
      date={date}
      session="morning"
      currentStep={step}
      totalSteps={15}
      stepLabel="Lekcje"
      prevHref="/dashboard"
      nextHref={`/cards/${date}/morning/2`}
    >
      <div className="flex flex-col gap-6">
        {/* Yesterday's lesson */}
        <div>
          <BridgeIndicator source="z wczorajszej karty" />
          <p
            className="mb-2 font-medium uppercase tracking-wide"
            style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
          >
            LEKCJA Z WCZORAJ:
          </p>
          {card.yesterdayLesson ? (
            <p
              className="px-4 py-3 rounded"
              style={{
                background: "var(--color-light)",
                borderLeft: `3px solid var(--color-gold)`,
                fontSize: "var(--font-size-body)",
                color: "var(--color-text)",
              }}
            >
              {card.yesterdayLesson}
            </p>
          ) : (
            <p
              style={{
                color: "var(--color-muted)",
                fontSize: "var(--font-size-body)",
                fontStyle: "italic",
              }}
            >
              Brak lekcji — to Twój pierwszy dzień w systemie.
            </p>
          )}
        </div>

        {/* Last week's lesson */}
        {card.lastWeekLesson && (
          <div>
            <BridgeIndicator source="z poprzedniego Weekly Review" />
            <p
              className="mb-2 font-medium uppercase tracking-wide"
              style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
            >
              LEKCJA Z POPRZ. TYGODNIA (Weekly Review):
            </p>
            <p
              className="px-4 py-3 rounded"
              style={{
                background: "var(--color-light)",
                borderLeft: `3px solid var(--color-mid)`,
                fontSize: "var(--font-size-body)",
                color: "var(--color-text)",
              }}
            >
              {card.lastWeekLesson}
            </p>
          </div>
        )}

        {/* Bridge 2 preview */}
        {bridge2Items.length > 0 && (
          <div>
            <p
              className="mb-2 font-medium uppercase tracking-wide"
              style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
            >
              PRIORYTETY Z WEEKLY REVIEW (pojawią się w pre-mortem):
            </p>
            <ul className="flex flex-col gap-1">
              {bridge2Items.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "var(--font-size-body)",
                    color: "var(--color-muted)",
                    fontStyle: "italic",
                  }}
                >
                  {i + 1}. {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </WizardLayout>
  )
}
