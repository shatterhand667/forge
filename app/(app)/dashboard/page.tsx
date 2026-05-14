import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/db"
import { getYesterdayLesson } from "@/lib/bridges"
import { LessonBanner } from "@/components/dashboard/LessonBanner"
import { CalendarView } from "@/components/dashboard/CalendarView"
import { HistoryList } from "@/components/dashboard/HistoryList"
import { PrimaryAction } from "@/components/dashboard/PrimaryAction"
import { WeeklyAction } from "@/components/dashboard/WeeklyAction"

function getCurrentWeekStart(now: Date): string {
  const dow = now.getUTCDay()
  const daysFromMon = dow === 0 ? 6 : dow - 1
  const mon = new Date(now)
  mon.setUTCDate(now.getUTCDate() - daysFromMon)
  return `${mon.getUTCFullYear()}-${String(mon.getUTCMonth() + 1).padStart(2, "0")}-${String(mon.getUTCDate()).padStart(2, "0")}`
}

export default async function DashboardPage() {
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

  const weekStartStr = getCurrentWeekStart(now)
  const weekStartDate = new Date(weekStartStr)
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 4)

  const [todayCard, lessonForBanner] = await Promise.all([
    prisma.dailyCard.findUnique({
      where: { userId_date: { userId, date: today } },
      select: { status: true },
    }),
    getYesterdayLesson(userId, today), // always fresh, not from stale stored bridge value
  ])

  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthStart = new Date(`${year}-${String(month).padStart(2, "0")}-01`)
  const monthEnd = new Date(`${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`)

  const [monthCards, recentCards, weeklyCardCount, currentWeeklyReview] = await Promise.all([
    prisma.dailyCard.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
      select: { date: true, status: true },
    }),
    prisma.dailyCard.findMany({
      where: { userId, date: { lt: today } },
      select: { date: true, status: true },
      orderBy: { date: "desc" },
      take: 14,
    }),
    prisma.dailyCard.count({
      where: { userId, date: { gte: weekStartDate, lte: weekEndDate }, status: "COMPLETED" },
    }),
    prisma.weeklyReview.findUnique({
      where: { userId_weekStart: { userId, weekStart: weekStartDate } },
      select: { status: true },
    }),
  ])

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

        <PrimaryAction
          dateStr={todayStr}
          status={todayCard?.status ?? "none"}
        />

        {weeklyCardCount >= 1 && (
          <WeeklyAction
            weekStart={weekStartStr}
            status={currentWeeklyReview?.status ?? "none"}
          />
        )}

        <section>
          <CalendarView
            year={now.getFullYear()}
            month={now.getMonth() + 1}
            cards={monthCards}
          />
        </section>

        <section>
          <h2
            className="mb-3 font-bold uppercase tracking-wide"
            style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
          >
            Poprzednie dni
          </h2>
          <HistoryList cards={recentCards} />
        </section>
      </main>
    </div>
  )
}
