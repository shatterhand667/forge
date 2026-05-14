import Link from "next/link"

interface WeeklyActionProps {
  weekStart: string
  status: "none" | "IN_PROGRESS" | "COMPLETED"
}

export function WeeklyAction({ weekStart, status }: WeeklyActionProps) {
  if (status === "COMPLETED") {
    return (
      <Link
        href={`/weekly/${weekStart}/complete`}
        className="block text-center px-6 py-2 rounded font-medium"
        style={{ background: "var(--color-dark)", color: "var(--color-white)", fontSize: 13 }}
      >
        Przegląd tygodniowy · {weekStart} — ukończony
      </Link>
    )
  }

  if (status === "IN_PROGRESS") {
    return (
      <Link
        href={`/weekly/${weekStart}/step/1`}
        className="block text-center px-6 py-2 rounded font-medium"
        style={{ background: "var(--color-gold)", color: "var(--color-white)", fontSize: 13 }}
      >
        Dokończ przegląd tygodniowy →
      </Link>
    )
  }

  return (
    <Link
      href={`/weekly/${weekStart}/step/1`}
      className="block text-center px-6 py-2 rounded font-medium"
      style={{ background: "var(--color-mid)", color: "var(--color-white)", fontSize: 13 }}
    >
      Rozpocznij przegląd tygodniowy
    </Link>
  )
}
