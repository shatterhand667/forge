import Link from "next/link"

interface PrimaryActionProps {
  dateStr: string
  status: "none" | "MORNING" | "COMPLETED"
}

const CONFIGS = {
  none: {
    label: "Rozpocznij kartę dzienną",
    href: (d: string) => `/cards/${d}/morning/1`,
    bg: "var(--color-mid)",
  },
  MORNING: {
    label: "Wróć do sesji wieczornej →",
    href: (d: string) => `/cards/${d}/evening/6`,
    bg: "var(--color-gold)",
  },
  COMPLETED: {
    label: "Pobierz PDF dzisiejszej karty",
    href: (d: string) => `/api/cards/${d}/pdf`,
    bg: "var(--color-dark)",
  },
}

export function PrimaryAction({ dateStr, status }: PrimaryActionProps) {
  const { label, href, bg } = CONFIGS[status]

  return (
    <Link
      href={href(dateStr)}
      className="block text-center px-6 py-3 rounded font-medium"
      style={{ background: bg, color: "var(--color-white)", fontSize: 14 }}
    >
      {label}
    </Link>
  )
}
