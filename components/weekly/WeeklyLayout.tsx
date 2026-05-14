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
          <div
            className="mt-2 rounded-full overflow-hidden"
            style={{ height: 3, background: "var(--color-border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%`, background: "var(--color-gold)" }}
            />
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

      <div className="mx-auto px-4 py-6" style={{ maxWidth: "var(--content-max-width)" }}>
        {children}
      </div>

      <div
        className="sticky bottom-0 border-t"
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
          {nextHref && (
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
          )}
        </div>
      </div>
    </div>
  )
}
