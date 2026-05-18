"use client"

import Link from "next/link"

interface WeeklyLayoutProps {
  children: React.ReactNode
  weekStart: string
  currentStep: number
  totalSteps: number
  stepLabel: string
  nextHref?: string
  prevHref?: string
  nextLabel?: string
  nextDisabled?: boolean
  onNext?: () => void
  lastWeekGoalRecap?: string | null
}

const TOTAL_STEPS = 11

export function WeeklyLayout({
  children,
  weekStart,
  currentStep,
  stepLabel,
  nextHref,
  prevHref,
  nextLabel = "Dalej →",
  nextDisabled = false,
  onNext,
  lastWeekGoalRecap,
}: WeeklyLayoutProps) {
  const progressPercent = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div
        className="sticky top-0 z-10 border-b"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div className="mx-auto px-4 py-2" style={{ maxWidth: "var(--content-max-width)" }}>
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="font-bold uppercase tracking-wider"
                style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-gold)", textDecoration: "none" }}
              >
                The Forge
              </Link>
              <span className="ml-2" style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
                Przegląd tygodniowy · {weekStart}
              </span>
            </div>
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
              Krok {currentStep} z {TOTAL_STEPS}
            </span>
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => {
              const s = i + 1
              const href = `/weekly/${weekStart}/step/${s}`
              const isCurrent = s === currentStep
              const isDone = s < currentStep
              return (
                <Link key={s} href={href} style={{ display: "flex", flex: 1 }}>
                  <span style={{
                    display: "block",
                    width: "100%",
                    height: isCurrent ? 5 : 3,
                    borderRadius: 2,
                    background: isCurrent
                      ? "var(--color-gold)"
                      : isDone
                      ? "var(--color-gold)"
                      : "var(--color-border)",
                    opacity: isDone ? 0.5 : 1,
                    transition: "all 0.2s",
                  }} />
                </Link>
              )
            })}
          </div>
          <p className="mt-1" style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
            {stepLabel}
          </p>
        </div>
        {lastWeekGoalRecap && (
          <div
            style={{
              borderTop: "1px solid var(--color-border)",
              background: "var(--color-light)",
              padding: "6px 16px",
            }}
          >
            <span
              style={{
                fontSize: "var(--font-size-tiny)",
                color: "var(--color-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginRight: "8px",
              }}
            >
              Cel z poprz. tygodnia:
            </span>
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text)" }}>
              {lastWeekGoalRecap}
            </span>
          </div>
        )}
      </div>

      <div className="mx-auto px-4 py-6 pb-20" style={{ maxWidth: "var(--content-max-width)" }}>
        {children}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 border-t z-10"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div
          className="mx-auto px-4 py-3 flex items-center justify-between"
          style={{ maxWidth: "var(--content-max-width)" }}
        >
          {prevHref ? (
            <Link href={prevHref} className="text-sm" style={{ color: "var(--color-muted)" }}>
              ← Wstecz
            </Link>
          ) : (
            <span />
          )}

          {onNext ? (
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{
                background: nextDisabled ? "var(--color-border)" : "var(--color-mid)",
                color: "var(--color-white)",
                opacity: nextDisabled ? 0.6 : 1,
                cursor: nextDisabled ? "not-allowed" : "pointer",
                border: "none",
              }}
            >
              {nextLabel}
            </button>
          ) : nextHref ? (
            <Link
              href={nextHref}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{
                background: nextDisabled ? "var(--color-border)" : "var(--color-mid)",
                color: "var(--color-white)",
                pointerEvents: nextDisabled ? "none" : "auto",
              }}
            >
              {nextLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
