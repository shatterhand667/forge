import Link from "next/link"

interface WizardLayoutProps {
  children: React.ReactNode
  date: string
  session: "morning" | "evening"
  currentStep: number
  totalSteps: number
  stepLabel: string
  nextHref?: string
  prevHref?: string
  nextLabel?: string
  nextDisabled?: boolean
}

const TOTAL_STEPS = 15

export function WizardLayout({
  children,
  date,
  session,
  currentStep,
  stepLabel,
  nextHref,
  prevHref,
  nextLabel = "Dalej →",
  nextDisabled = false,
}: WizardLayoutProps) {
  const progressPercent = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 border-b"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div className="mx-auto px-4 py-2" style={{ maxWidth: "var(--content-max-width)" }}>
          <div className="flex items-center justify-between">
            <div>
              <span
                className="font-bold uppercase tracking-wider"
                style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-gold)" }}
              >
                The Forge
              </span>
              <span
                className="ml-2"
                style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
              >
                {session === "morning" ? "Sesja poranna" : "Sesja wieczorna"} · {date}
              </span>
            </div>
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
              Krok {currentStep} z {TOTAL_STEPS}
            </span>
          </div>
          {/* Progress bar */}
          <div
            className="mt-2 rounded-full overflow-hidden"
            style={{ height: 3, background: "var(--color-border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%`, background: "var(--color-gold)" }}
            />
          </div>
          <p
            className="mt-1"
            style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
          >
            {stepLabel}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto px-4 py-6" style={{ maxWidth: "var(--content-max-width)" }}>
        {children}
      </div>

      {/* Navigation */}
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
