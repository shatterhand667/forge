"use client"
import { useState } from "react"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, BridgeIndicator } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

const DAY_NAMES: Record<number, string> = { 1: "Poniedziałek", 2: "Wtorek", 3: "Środa", 4: "Czwartek", 5: "Piątek" }

interface LessonEntry { date: Date; yesterdayLesson: string | null }
interface LessonApplication { date: string; applied: boolean | null }

interface Props {
  review: WeeklyReview
  stats: WeeklyStats
  weekStart: string
  step: number
  weekLessons: LessonEntry[]
}

function LessonCard({
  dayLabel, lesson, applied, onToggle,
}: { dayLabel: string; lesson: string; applied: boolean | null; onToggle: (v: boolean) => void }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = lesson.length > 180

  return (
    <div style={{ borderBottom: "0.5px solid var(--color-border)", paddingBottom: 10, marginBottom: 10 }}>
      <div className="flex items-start justify-between gap-4">
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>
            {dayLabel}
          </span>
          <p
            style={{
              fontSize: "var(--font-size-body)",
              color: "var(--color-text)",
              marginTop: 2,
              lineHeight: 1.5,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: expanded ? "unset" : 3,
            } as React.CSSProperties}
          >
            {lesson}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", marginTop: 2, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {expanded ? "Zwiń ↑" : "Rozwiń ↓"}
            </button>
          )}
        </div>
        <div className="flex gap-1 shrink-0" style={{ marginTop: 18 }}>
          {([true, false] as const).map((val) => (
            <button
              key={String(val)}
              onClick={() => onToggle(val)}
              style={{
                fontSize: "var(--font-size-tiny)",
                padding: "2px 10px",
                borderRadius: 4,
                border: "1px solid",
                cursor: "pointer",
                borderColor: applied === val ? (val ? "#2D6A4F" : "#D96060") : "var(--color-border)",
                background: applied === val ? (val ? "#2D6A4F" : "#D96060") : "var(--color-white)",
                color: applied === val ? "var(--color-white)" : "var(--color-muted)",
              }}
            >
              {val ? "Tak" : "Nie"}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function fmt(n: number, decimals = 2) {
  return n === 0 ? "—" : n.toFixed(decimals)
}

function pct(n: number) {
  return n === 0 ? "—" : `${(n * 100).toFixed(0)}%`
}

function formatWeekRange(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number)
  const fri = new Date(Date.UTC(y, m - 1, d + 4))
  const pad = (n: number) => String(n).padStart(2, "0")
  const monDay = pad(d)
  const friDay = pad(fri.getUTCDate())
  const monMonth = pad(m)
  const friMonth = pad(fri.getUTCMonth() + 1)
  if (monMonth === friMonth) return `${monDay}–${friDay}.${monMonth}`
  return `${monDay}.${monMonth}–${friDay}.${friMonth}`
}

function ScoreRow({ label, avg, max }: { label: string; avg: number | null; max: number }) {
  const filled = avg !== null ? Math.round(avg) : 0
  return (
    <div className="flex items-center gap-3">
      <span style={{ minWidth: 160, color: "var(--color-muted)", fontSize: "var(--font-size-label)" }}>{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <span
            key={n}
            style={{
              display: "block",
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: "1.5px solid var(--color-gold)",
              background: avg !== null && n <= filled ? "var(--color-gold)" : "transparent",
            }}
          />
        ))}
      </div>
      <span style={{ color: "var(--color-muted)", fontSize: "var(--font-size-label)" }}>
        {avg !== null ? avg.toFixed(1) : "—"}
      </span>
    </div>
  )
}

function WeekLabel({ weekStart, sessionCount }: { weekStart: string; sessionCount: number }) {
  return (
    <td style={{ padding: "6px 8px", fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap" }}>
      <div>{formatWeekRange(weekStart)}</div>
      <div style={{ fontWeight: 400, color: "var(--color-muted)", fontSize: "var(--font-size-tiny)" }}>
        {sessionCount} {sessionCount === 1 ? "sesja" : sessionCount < 5 ? "sesje" : "sesji"}
      </div>
    </td>
  )
}

export function WeeklyStep1Stats({ review, stats, weekStart, step, weekLessons }: Props) {
  const [maxDrawdown, setMaxDrawdown] = useState(review.maxDrawdown ?? "")

  const rawApplications = Array.isArray(review.lessonApplications)
    ? (review.lessonApplications as unknown as LessonApplication[])
    : []
  const [applications, setApplications] = useState<LessonApplication[]>(rawApplications)

  async function handleSave(value: string) {
    await updateWeeklyReview(review.id, { maxDrawdown: value || undefined })
  }

  async function handleToggle(dateStr: string, applied: boolean) {
    const updated = applications.some(a => a.date === dateStr)
      ? applications.map(a => a.date === dateStr ? { ...a, applied } : a)
      : [...applications, { date: dateStr, applied }]
    setApplications(updated)
    await updateWeeklyReview(review.id, { lessonApplications: updated as any })
  }

  const lessons = weekLessons.filter(l => l.yesterdayLesson)

  return (
    <WeeklyLayout
      weekStart={weekStart}
      currentStep={step}
      totalSteps={11}
      stepLabel="Statystyki tygodnia"
      prevHref="/dashboard"
      nextHref={`/weekly/${weekStart}/step/2`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="1" title="STATYSTYKI TYGODNIA" />
        <BridgeIndicator source="z kart dziennych" />

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--font-size-tiny)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--color-muted)" }}></th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", borderLeft: "0.5px solid var(--color-border)" }}>Tradów</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", borderLeft: "0.5px solid var(--color-border)" }}>Win%</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", borderLeft: "0.5px solid var(--color-border)" }}>Avg R</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", borderLeft: "0.5px solid var(--color-border)" }}>PF</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", borderLeft: "0.5px solid var(--color-border)" }}>Best R</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", borderLeft: "0.5px solid var(--color-border)" }}>Worst R</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", borderLeft: "0.5px solid var(--color-border)" }}>Max DD</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", borderLeft: "0.5px solid var(--color-border)" }}>Net P&L</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <WeekLabel weekStart={weekStart} sessionCount={stats.sessionCount} />
                <td style={{ padding: "6px 8px", textAlign: "center", borderLeft: "0.5px solid var(--color-border)" }}>{stats.trades}</td>
                <td style={{ padding: "6px 8px", textAlign: "center", borderLeft: "0.5px solid var(--color-border)" }}>{pct(stats.winRate)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center", borderLeft: "0.5px solid var(--color-border)" }}>{fmt(stats.avgR)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center", borderLeft: "0.5px solid var(--color-border)" }}>{fmt(stats.profitFactor)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center", borderLeft: "0.5px solid var(--color-border)" }}>{fmt(stats.bestR)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center", borderLeft: "0.5px solid var(--color-border)" }}>{fmt(stats.worstR)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center", borderLeft: "0.5px solid var(--color-border)" }}>
                  <input
                    value={maxDrawdown}
                    onChange={e => setMaxDrawdown(e.target.value)}
                    onBlur={() => handleSave(maxDrawdown)}
                    placeholder="—"
                    style={{
                      width: 60,
                      textAlign: "center",
                      border: "none",
                      borderBottom: "1px solid var(--color-border)",
                      background: "transparent",
                      fontSize: "var(--font-size-tiny)",
                      color: "var(--color-text)",
                    }}
                  />
                </td>
                <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, borderLeft: "0.5px solid var(--color-border)",
                  color: stats.totalPnL > 0 ? "#2D8C4E" : stats.totalPnL < 0 ? "#D96060" : "var(--color-muted)" }}>
                  {stats.totalPnL !== 0
                    ? `${stats.totalPnL > 0 ? "+" : ""}${stats.totalPnL.toFixed(2)}`
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", fontStyle: "italic" }}>
          Max DD wpisz ręcznie (z platformy brokerskiej).
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--font-size-tiny)" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--color-muted)" }}></th>
              <th style={{ padding: "4px 8px", color: "var(--color-muted)", borderLeft: "0.5px solid var(--color-border)" }}>Sen (1–10)</th>
              <th style={{ padding: "4px 8px", color: "var(--color-muted)", borderLeft: "0.5px solid var(--color-border)" }}>Energia (1–10)</th>
              <th style={{ padding: "4px 8px", color: "var(--color-muted)", borderLeft: "0.5px solid var(--color-border)" }}>Fokus (1–10)</th>
              <th style={{ padding: "4px 8px", color: "var(--color-muted)", borderLeft: "0.5px solid var(--color-border)" }}>Przygotowanie (1–10)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <WeekLabel weekStart={weekStart} sessionCount={stats.sessionCount} />
              <td style={{ padding: "6px 8px", textAlign: "center", borderLeft: "0.5px solid var(--color-border)" }}>{fmt(stats.sleepAvg, 1)}</td>
              <td style={{ padding: "6px 8px", textAlign: "center", borderLeft: "0.5px solid var(--color-border)" }}>{stats.energyAvg !== null ? stats.energyAvg.toFixed(1) : "—"}</td>
              <td style={{ padding: "6px 8px", textAlign: "center", borderLeft: "0.5px solid var(--color-border)" }}>{stats.focusAvg !== null ? stats.focusAvg.toFixed(1) : "—"}</td>
              <td style={{ padding: "6px 8px", textAlign: "center", borderLeft: "0.5px solid var(--color-border)" }}>{stats.prepQualityAvg !== null ? stats.prepQualityAvg.toFixed(1) : "—"}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
          <ScoreRow label="Proces (1–10):" avg={stats.processAvg} max={10} />
          <ScoreRow label="Ogólna ocena (1–10):" avg={stats.overallAvg} max={10} />
        </div>

        {lessons.length > 0 && (
          <div className="flex flex-col gap-0 mt-2">
            <SectionHeader number="1b" title="LEKCJE DNIA — CZY ZASTOSOWAŁEŚ?" />
            <div className="mt-3">
              {lessons.map(l => {
                const dateStr = new Date(l.date).toISOString().split("T")[0]
                const dow = new Date(l.date).getUTCDay()
                const dayLabel = DAY_NAMES[dow] ?? dateStr
                const app = applications.find(a => a.date === dateStr)
                return (
                  <LessonCard
                    key={dateStr}
                    dayLabel={dayLabel}
                    lesson={l.yesterdayLesson!}
                    applied={app?.applied ?? null}
                    onToggle={(v) => handleToggle(dateStr, v)}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </WeeklyLayout>
  )
}
