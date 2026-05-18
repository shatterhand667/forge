import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getWeeklyReview } from "@/actions/weekly"
import Link from "next/link"

export default async function WeeklyCompletePage({
  params,
}: {
  params: Promise<{ weekStart: string }>
}) {
  const { weekStart } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const review = await getWeeklyReview(weekStart)
  if (!review) redirect(`/weekly/${weekStart}/step/1`)

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div
        className="sticky top-0 z-10 border-b"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div className="mx-auto px-4 py-2" style={{ maxWidth: "var(--content-max-width)" }}>
          <Link
            href="/dashboard"
            className="font-bold uppercase tracking-wider"
            style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-gold)", textDecoration: "none" }}
          >
            The Forge
          </Link>
        </div>
      </div>

      <div
        className="mx-auto px-4 py-8 flex flex-col gap-6"
        style={{ maxWidth: "var(--content-max-width)" }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-gold)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 8,
            }}
          >
            Przegląd tygodniowy · {weekStart}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
            Tydzień zamknięty.
          </h1>
          {review.oneSentenceSummary && (
            <p style={{ fontSize: "var(--font-size-body)", color: "var(--color-muted)", fontStyle: "italic" }}>
              „{review.oneSentenceSummary}"
            </p>
          )}
        </div>

        {review.processGoalNextWeek && (
          <div
            style={{
              padding: "12px 16px",
              borderLeft: "3px solid var(--color-gold)",
              background: "var(--color-light)",
            }}
          >
            <p
              style={{
                fontSize: "var(--font-size-tiny)",
                color: "var(--color-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 4,
              }}
            >
              Cel na przyszły tydzień:
            </p>
            <p style={{ fontSize: "var(--font-size-body)", color: "var(--color-text)" }}>
              {review.processGoalNextWeek}
              {review.processGoalProbability && (
                <span style={{ color: "var(--color-muted)", marginLeft: 8 }}>
                  ({review.processGoalProbability}%)
                </span>
              )}
            </p>
          </div>
        )}

        {review.bridgeStrategicTopic && (
          <div
            style={{
              padding: "12px 16px",
              borderLeft: "3px solid var(--color-mid)",
              background: "var(--color-light)",
            }}
          >
            <p
              style={{
                fontSize: "var(--font-size-tiny)",
                color: "var(--color-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 4,
              }}
            >
              Temat strategiczny (Most do Daily):
            </p>
            <p style={{ fontSize: "var(--font-size-body)", color: "var(--color-text)" }}>
              {review.bridgeStrategicTopic}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <a
            href={`/api/weekly/${weekStart}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center px-6 py-3 rounded font-medium"
            style={{ background: "var(--color-gold)", color: "var(--color-white)", fontSize: 14 }}
          >
            Pobierz przegląd (PDF)
          </a>
          <Link
            href={`/weekly/${weekStart}/step/1`}
            className="block text-center px-6 py-3 rounded font-medium"
            style={{ background: "var(--color-border)", color: "var(--color-text)", fontSize: 14 }}
          >
            Edytuj przegląd
          </Link>
          <Link
            href="/dashboard"
            className="block text-center px-6 py-3 rounded font-medium"
            style={{ background: "var(--color-mid)", color: "var(--color-white)", fontSize: 14 }}
          >
            Wróć do dashboardu →
          </Link>
        </div>
      </div>
    </div>
  )
}
