import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/db"
import { LessonBanner } from "@/components/dashboard/LessonBanner"
import { CalendarView } from "@/components/dashboard/CalendarView"
import { HistoryList } from "@/components/dashboard/HistoryList"
import { PrimaryAction } from "@/components/dashboard/PrimaryAction"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user.id

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split("T")[0]

  const todayCard = await prisma.dailyCard.findUnique({
    where: { userId_date: { userId, date: today } },
    select: { status: true, yesterdayLesson: true },
  })

  const lessonForBanner =
    todayCard?.status === "MORNING" || todayCard?.status === "COMPLETED"
      ? todayCard.yesterdayLesson
      : null

  const now = new Date()
  const monthCards = await prisma.dailyCard.findMany({
    where: {
      userId,
      date: {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
        lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      },
    },
    select: { date: true, status: true },
  })

  const recentCards = await prisma.dailyCard.findMany({
    where: {
      userId,
      date: { lt: today },
    },
    select: { date: true, status: true },
    orderBy: { date: "desc" },
    take: 14,
  })

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
