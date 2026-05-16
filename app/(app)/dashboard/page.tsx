import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/db"
import { getYesterdayLesson } from "@/lib/bridges"
import { LessonBanner } from "@/components/dashboard/LessonBanner"
import { CalendarView } from "@/components/dashboard/CalendarView"
import { WeekHistory, type WeekEntry } from "@/components/dashboard/WeekHistory"
import { PlaybookView } from "@/components/dashboard/PlaybookView"
import { CalibrationView } from "@/components/dashboard/CalibrationView"
import { getPlaybook } from "@/actions/playbook"
import { getCalibrationGoals } from "@/actions/calibration"

function getWeekStartStr(date: Date): string {
  const dow = date.getUTCDay()
  const daysFromMon = dow === 0 ? 6 : dow - 1
  const mon = new Date(date)
  mon.setUTCDate(date.getUTCDate() - daysFromMon)
  return `${mon.getUTCFullYear()}-${String(mon.getUTCMonth() + 1).padStart(2, "0")}-${String(mon.getUTCDate()).padStart(2, "0")}`
}

const WEEKS_PER_PAGE = 8

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tab?: string }>
}) {
  const { page: pageParam, tab } = await searchParams
  const activeTab = tab === "playbook" ? "playbook" : tab === "kalibracja" ? "kalibracja" : "historia"
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10))
  const session = await auth()
  const userId = session!.user.id

  // Use local date components to avoid UTC offset shifting "today" to yesterday
  const now = new Date()
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-")
  const today = new Date(todayStr) // UTC midnight for local date — consistent with stored card dates

  const weekStartStr = getWeekStartStr(today)
  const weekStartDate = new Date(weekStartStr)

  const [todayCard, lessonForBanner] = await Promise.all([
    prisma.dailyCard.findUnique({
      where: { userId_date: { userId, date: today } },
      select: { status: true },
    }),
    getYesterdayLesson(userId, today),
  ])

  const [allCards, currentWeeklyReview, pastWeeklyReviews, playbook, calibrationGoals] = await Promise.all([
    prisma.dailyCard.findMany({
      where: { userId },
      select: { date: true, status: true },
    }),
    prisma.weeklyReview.findUnique({
      where: { userId_weekStart: { userId, weekStart: weekStartDate } },
      select: { status: true },
    }),
    prisma.weeklyReview.findMany({
      where: { userId, weekStart: { lt: weekStartDate } },
      select: { weekStart: true, status: true },
    }),
    getPlaybook(),
    getCalibrationGoals(),
  ])

  const pastCards = allCards.filter((c) => new Date(c.date) < weekStartDate)

  // Group past cards and weekly reviews by week
  const weekMap = new Map<string, WeekEntry>()

  for (const card of pastCards) {
    const ws = getWeekStartStr(new Date(card.date))
    if (!weekMap.has(ws)) weekMap.set(ws, { weekStart: ws, days: [], weeklyReview: null })
    weekMap.get(ws)!.days.push(card)
  }

  for (const wr of pastWeeklyReviews) {
    const ws = new Date(wr.weekStart).toISOString().split("T")[0]
    if (!weekMap.has(ws)) weekMap.set(ws, { weekStart: ws, days: [], weeklyReview: null })
    weekMap.get(ws)!.weeklyReview = wr as { status: "IN_PROGRESS" | "COMPLETED" }
  }

  const allWeeks = Array.from(weekMap.values()).sort((a, b) =>
    b.weekStart.localeCompare(a.weekStart)
  )
  const totalPages = Math.max(1, Math.ceil(allWeeks.length / WEEKS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const weekHistory = allWeeks.slice((safePage - 1) * WEEKS_PER_PAGE, safePage * WEEKS_PER_PAGE)

  const weeklyReviewMap: Record<string, "IN_PROGRESS" | "COMPLETED"> = {}
  for (const wr of pastWeeklyReviews) {
    const ws = new Date(wr.weekStart).toISOString().split("T")[0]
    weeklyReviewMap[ws] = wr.status as "IN_PROGRESS" | "COMPLETED"
  }
  if (currentWeeklyReview?.status) {
    weeklyReviewMap[weekStartStr] = currentWeeklyReview.status as "IN_PROGRESS" | "COMPLETED"
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <header
        className="border-b"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div
          className="mx-auto px-4 py-3 flex items-center justify-between"
          style={{ maxWidth: "var(--content-max-width)" }}
        >
          <span
            className="font-bold uppercase tracking-widest"
            style={{ color: "var(--color-gold)", fontSize: "var(--font-size-tiny)" }}
          >
            THE FORGE
          </span>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              style={{ color: "var(--color-muted)", fontSize: "var(--font-size-tiny)" }}
            >
              Wyloguj
            </button>
          </form>
        </div>
      </header>

      <main
        className="mx-auto px-4 py-6 flex flex-col gap-6"
        style={{ maxWidth: "var(--content-max-width)" }}
      >
        {lessonForBanner && <LessonBanner lesson={lessonForBanner} />}

        {/* <PrimaryAction
          dateStr={todayStr}
          status={todayCard?.status ?? "none"}
        /> */}

        {/* <WeeklyAction
          weekStart={weekStartStr}
          status={currentWeeklyReview?.status ?? "none"}
        /> */}

        <section>
          <CalendarView
            initialYear={now.getFullYear()}
            initialMonth={now.getMonth() + 1}
            allCards={allCards}
            weeklyReviews={weeklyReviewMap}
          />
        </section>

        <section>
          {/* Tab buttons */}
          <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
            {([
              { key: "historia", label: "Historia", href: "/dashboard" },
              { key: "kalibracja", label: "Kalibracja", href: "/dashboard?tab=kalibracja" },
              { key: "playbook", label: "Playbook", href: "/dashboard?tab=playbook" },
            ] as const).map(({ key, label, href }) => (
              <a
                key={key}
                href={href}
                style={{
                  padding: "5px 14px",
                  fontSize: "var(--font-size-tiny)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  textDecoration: "none",
                  borderRadius: 2,
                  background: activeTab === key ? "var(--color-mid)" : "var(--color-light)",
                  color: activeTab === key ? "#fff" : "var(--color-muted)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {label}
              </a>
            ))}
            <a
              href="/statistics"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "5px 14px",
                fontSize: "var(--font-size-tiny)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                textDecoration: "none",
                borderRadius: 2,
                background: "var(--color-light)",
                color: "var(--color-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              Statystyki
            </a>
          </div>

          {activeTab === "historia" && (
            <WeekHistory weeks={weekHistory} currentPage={safePage} totalPages={totalPages} />
          )}
          {activeTab === "kalibracja" && (
            <CalibrationView goals={calibrationGoals as any} />
          )}
          {activeTab === "playbook" && (
            <PlaybookView playbook={playbook as any} />
          )}
        </section>
      </main>
    </div>
  )
}
