import Link from "next/link"
import { getDailyCard } from "@/actions/cards"
import { redirect } from "next/navigation"
import { MentorCommentForm } from "@/components/dashboard/MentorCommentForm"

export default async function CompletePage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params
  const card = await getDailyCard(date)
  if (!card || card.status !== "COMPLETED") redirect(`/cards/${date}/morning/1`)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="text-center">
        <p
          style={{
            color: "var(--color-gold)",
            fontSize: "var(--font-size-tiny)",
            fontWeight: "var(--font-weight-bold)",
          }}
        >
          THE FORGE
        </p>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--color-dark)" }}>
          Dzień ukończony
        </h1>
        <p className="mt-2" style={{ color: "var(--color-muted)", fontSize: "var(--font-size-body)" }}>
          Dobra robota. Karta dzienna zapisana.
        </p>
      </div>

      <MentorCommentForm cardId={card.id} initialComment={card.mentorComment} />

      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 300 }}>
        <a
          href={`/api/cards/${date}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center px-4 py-2 rounded font-medium"
          style={{ background: "var(--color-gold)", color: "var(--color-white)" }}
        >
          Pobierz kartę (PDF)
        </a>
        <Link
          href={`/cards/${date}/morning/1`}
          className="block text-center px-4 py-2 rounded"
          style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)", fontSize: 14 }}
        >
          Edytuj kartę
        </Link>
        <Link
          href="/dashboard"
          className="block text-center px-4 py-2 rounded"
          style={{ background: "var(--color-mid)", color: "var(--color-white)" }}
        >
          Wróć do dashboardu
        </Link>
      </div>
    </div>
  )
}
