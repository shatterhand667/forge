# The Forge — Phase 1 MVP: Part 3 — Completion

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Phase 1 MVP — PDF export, dashboard (lesson banner + calendar + history), auth pages (login/register), landing page, and Railway deployment. After this part: the full Phase 1 MVP is live.

**Prerequisite:** Parts 1 and 2 complete (foundation + wizard working end-to-end).

**Continues from:** `2026-05-05-phase1-part2-wizard.md`

---

## File Map (Part 3)

```
WEB/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx
│   │   └── dashboard/page.tsx
│   ├── api/
│   │   └── cards/[date]/pdf/route.ts
│   └── page.tsx                     ← landing
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   └── dashboard/
│       ├── LessonBanner.tsx
│       ├── CalendarView.tsx
│       ├── HistoryList.tsx
│       └── PrimaryAction.tsx
└── railway.json                     ← Railway config
```

---

## Task 21: PDF export

**Files:**
- Create: `app/api/cards/[date]/pdf/route.ts`

The PDF renders a server-side HTML version of the completed daily card and converts it with Puppeteer.

- [ ] **Step 1: Create the PDF API route**

```typescript
// app/api/cards/[date]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import puppeteer from "puppeteer"

export async function GET(
  req: NextRequest,
  { params }: { params: { date: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const date = new Date(params.date)
  const card = await prisma.dailyCard.findUnique({
    where: { userId_date: { userId: session.user.id, date } },
    include: {
      trades: { orderBy: { createdAt: "asc" } },
      emotionEntries: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!card) return new NextResponse("Not found", { status: 404 })

  const html = buildCardHtml(card, params.date)

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "networkidle0" })

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
  })

  await browser.close()

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="forge-${params.date}.pdf"`,
    },
  })
}

function buildCardHtml(card: any, dateStr: string): string {
  const tradeRows = card.trades
    .map(
      (t: any) => `
      <tr>
        <td>${t.time ?? ""}</td><td>${t.trigger ?? ""}</td><td>${t.setup ?? ""}</td>
        <td>${t.direction ?? ""}</td><td>${t.tier ?? ""}</td>
        <td>${t.rExpected ?? ""}</td><td>${t.rActual ?? ""}</td>
        <td>${t.emotion ?? ""}</td><td>${t.lessons ?? ""}</td>
      </tr>`
    )
    .join("")

  const emotionRows = card.emotionEntries
    .map(
      (e: any) => `
      <tr>
        <td>${e.time ?? ""}</td><td>${e.emotion ?? ""}</td>
        <td>${e.triggerContext ?? ""}</td><td>${e.meaningSignal ?? ""}</td>
        <td>${e.reaction ?? ""}</td>
      </tr>`
    )
    .join("")

  const dotHtml = (value: number | null, max = 5) =>
    Array.from({ length: max }, (_, i) =>
      `<span class="dot ${i + 1 <= (value ?? 0) ? "dot-filled" : ""}">${i + 1}</span>`
    ).join("")

  const goldCircleHtml = (value: number | null) =>
    Array.from({ length: 5 }, (_, i) =>
      `<span class="gold-circle ${i + 1 <= (value ?? 0) ? "gold-circle-filled" : ""}"></span>`
    ).join("")

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Inter, Arial, sans-serif; font-size: 11px; color: #1a2332; background: #fff; }
  .section-header { background: #1e3a5f; color: #fff; padding: 5px 12px 5px 16px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; margin: 12px 0 6px; position: relative; border-radius: 2px; }
  .section-header::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #c9963d; }
  .field-row { display: flex; align-items: baseline; gap: 8px; padding: 2px 0; border-bottom: 0.5px solid #d1d5db; min-height: 18px; }
  .field-label { color: #6b7280; min-width: 130px; white-space: nowrap; font-size: 10px; }
  .field-value { flex: 1; font-size: 10px; }
  .dot { display: inline-flex; align-items: center; justify-content: center; width: 13px; height: 13px; border: 0.8px solid #1e3a5f; border-radius: 50%; font-size: 7px; color: #6b7280; margin-right: 4px; }
  .dot-filled { background: #1e3a5f; color: #fff; }
  .gold-circle { display: inline-block; width: 16px; height: 16px; border: 1.5px solid #c9963d; border-radius: 50%; margin-right: 5px; }
  .gold-circle-filled { background: #c9963d; }
  table { width: 100%; border-collapse: collapse; font-size: 9px; margin-top: 4px; }
  th { background: #1e3a5f; color: #fff; padding: 3px 4px; font-weight: 600; text-align: left; }
  td { border-bottom: 0.5px solid #d1d5db; padding: 3px 4px; vertical-align: top; min-height: 16px; }
  .lesson-box { background: #f5f6f7; border-left: 3px solid #c9963d; padding: 6px 10px; font-size: 10px; margin-bottom: 6px; }
  .scale-anchor { font-style: italic; color: #6b7280; font-size: 8px; margin-top: 3px; }
  .title-bar { background: #f5f6f7; border-left: 3px solid #c9963d; padding: 6px 12px; margin-bottom: 8px; }
  h1 { font-size: 13px; font-weight: 700; color: #1e3a5f; }
  .when-then { display: flex; gap: 8px; align-items: baseline; border-bottom: 0.5px solid #d1d5db; padding: 3px 0; }
</style>
</head>
<body>
  <div class="title-bar">
    <h1>TRADING POD · DAILY CARD</h1>
    <div class="field-row"><span class="field-label">Data:</span><span class="field-value">${dateStr}</span></div>
  </div>

  ${card.yesterdayLesson ? `<div class="lesson-box">LEKCJA Z WCZORAJ: ${card.yesterdayLesson}</div>` : ""}
  ${card.lastWeekLesson ? `<div class="lesson-box" style="border-color:#1e3a5f">LEKCJA Z POPRZ. TYGODNIA: ${card.lastWeekLesson}</div>` : ""}

  <div class="section-header">1. KONTEKST OSOBISTY (RANO)</div>
  <div class="field-row"><span class="field-label">Sen:</span>${dotHtml(card.sleep)}</div>
  <div class="field-row"><span class="field-label">Energia:</span>${dotHtml(card.energy)}</div>
  <div class="field-row"><span class="field-label">Fokus:</span>${dotHtml(card.focus)}</div>
  <div class="field-row"><span class="field-label">Jakość przygotowania:</span>${dotHtml(card.prepQuality)}</div>
  <div class="field-row"><span class="field-label">Nastrój / notatki:</span><span class="field-value">${card.moodNotes ?? ""}</span></div>

  <div class="section-header">2. KONTEKST RYNKOWY</div>
  <div class="field-row"><span class="field-label">Trend / bias:</span><span class="field-value">${card.trendBias ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Kluczowe poziomy:</span><span class="field-value">${card.keyLevels ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Makro / news:</span><span class="field-value">${card.macroNews ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Korelacje:</span><span class="field-value">${card.correlations ?? ""}</span></div>

  <div class="section-header">3. PLAN DNIA</div>
  <div class="field-row"><span class="field-label">What-ifs:</span><span class="field-value">${card.whatIfs ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Warunki wejścia:</span><span class="field-value">${card.entryConditions ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Setup A (100%):</span><span class="field-value">${card.tierASetup ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Setup B (50%):</span><span class="field-value">${card.tierBSetup ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Setup C (25%):</span><span class="field-value">${card.tierCSetup ?? ""}</span></div>

  <div class="section-header">4. PRE-MORTEM</div>
  <div class="field-row"><span class="field-label">Co mogę dziś zepsuć?</span><span class="field-value">${card.preMortem ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Cel dzienny:</span><span class="field-value">${card.dailyGoal ?? ""}</span></div>

  <div class="section-header">5. LOG TRANSAKCJI</div>
  <table>
    <thead><tr><th>Czas</th><th>Trigger</th><th>Setup</th><th>Kier.</th><th>Tier</th><th>R plan.</th><th>R real.</th><th>Emocja</th><th>Lekcje</th></tr></thead>
    <tbody>${tradeRows}</tbody>
  </table>

  <div class="section-header">6. LOG EMOCJI</div>
  <table>
    <thead><tr><th>Czas</th><th>Emocja</th><th>Trigger / kontekst</th><th>Znaczenie (sygnał)</th><th>Reakcja</th></tr></thead>
    <tbody>${emotionRows}</tbody>
  </table>

  <div class="section-header">7. OCENY OBSZARÓW</div>
  <div class="field-row"><span class="field-label">Setupy:</span>${dotHtml(null)}</div>
  <div class="field-row"><span class="field-label">Egzekucja:</span>${dotHtml(null)}</div>
  <div class="field-row"><span class="field-label">Zarządzanie ryzykiem:</span>${dotHtml(null)}</div>
  <div class="field-row"><span class="field-label">Psychologia:</span>${dotHtml(null)}</div>
  <div class="field-row"><span class="field-label">Dyscyplina:</span>${dotHtml(null)}</div>
  <div class="scale-anchor">1 = naruszenie zasad · 3 = poprawnie ale automatycznie · 5 = świadomie i zgodnie z planem</div>

  <div class="section-header">8. SILNE STRONY W AKCJI</div>
  <div class="field-row"><span class="field-value">${card.strengthsUsed ?? ""}</span></div>

  <div class="section-header">9. JEDNA RZECZ DO POPRAWY</div>
  <div class="when-then">
    <span class="field-label">Kiedy</span>
    <span class="field-value">${card.improvementWhen ?? ""}</span>
    <span class="field-label">wtedy</span>
    <span class="field-value">${card.improvementThen ?? ""}</span>
  </div>
  <div class="field-row"><span class="field-value">${card.improvementExtra ?? ""}</span></div>

  <div class="section-header">10. STAN MENTALNY PO SESJI</div>
  <div class="field-row"><span class="field-label">Stan mentalny:</span>${dotHtml(card.mentalAfter)}</div>
  <div class="field-row"><span class="field-label">Co na niego wpłynęło?</span><span class="field-value">${card.whatShapedIt ?? ""}</span></div>

  <div class="section-header">11. DELIBERATE PRACTICE</div>
  <div class="field-row"><span class="field-value">${card.deliberatePractice ?? ""}</span></div>

  <div class="section-header">12. OCENA DZIENNA</div>
  <div class="field-row"><span class="field-label">Process score (1–10):</span><span class="field-value">${card.processScore ?? "—"}</span></div>
  <div class="field-row"><span class="field-label">P&amp;L:</span><span class="field-value">${card.pl ?? ""}</span></div>
  <div class="field-row"><span class="field-label">Ogólna ocena:</span>${goldCircleHtml(card.overallScore)}</div>

  <div class="section-header">13. TOŻSAMOŚĆ</div>
  <div class="field-row"><span class="field-label">DUMNY:</span><span class="field-value">${card.proudOf ?? ""}</span></div>
  <div class="field-row"><span class="field-label">ZAWSTYDZONY:</span><span class="field-value">${card.ashamedOf ?? ""}</span></div>

  <div class="section-header">14. LEKCJA NA JUTRO</div>
  <div class="field-row"><span class="field-value">${card.tomorrowRemember ?? ""}</span></div>
</body>
</html>`
}
```

- [ ] **Step 2: Test PDF manually**

Start the dev server (`pnpm dev`), log in, complete a daily card, then visit:
`http://localhost:3000/api/cards/2026-05-06/pdf`

Expected: PDF downloads with all filled fields visible in navy/gold design.

- [ ] **Step 3: Commit**

```powershell
git add app/api/cards/
git commit -m "feat: PDF export via Puppeteer — daily card download"
```

---

## Task 22: LessonBanner component

**Files:**
- Create: `components/dashboard/LessonBanner.tsx`

- [ ] **Step 1: Create LessonBanner.tsx**

```tsx
// components/dashboard/LessonBanner.tsx
interface LessonBannerProps {
  lesson: string
}

export function LessonBanner({ lesson }: LessonBannerProps) {
  return (
    <div
      className="rounded px-4 py-3 flex gap-3 items-start"
      style={{
        background: "var(--color-light)",
        borderLeft: "4px solid var(--color-gold)",
      }}
    >
      <span style={{ color: "var(--color-gold)", fontSize: 18, lineHeight: 1 }}>📌</span>
      <div>
        <p
          className="font-medium mb-1"
          style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}
        >
          Pamiętaj o lekcji z wczoraj:
        </p>
        <p style={{ fontSize: "var(--font-size-body)", color: "var(--color-text)" }}>
          {lesson}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
git add components/dashboard/LessonBanner.tsx
git commit -m "feat: LessonBanner dashboard component"
```

---

## Task 23: CalendarView component (TDD)

**Files:**
- Create: `__tests__/components/dashboard/CalendarView.test.tsx`
- Create: `components/dashboard/CalendarView.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// __tests__/components/dashboard/CalendarView.test.tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { CalendarView } from "@/components/dashboard/CalendarView"

const cards = [
  { date: new Date("2026-05-04"), status: "COMPLETED" as const },
  { date: new Date("2026-05-05"), status: "MORNING" as const },
]

describe("CalendarView", () => {
  it("renders all days of the month", () => {
    render(<CalendarView year={2026} month={5} cards={cards} />)
    // May 2026 has 31 days
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("31")).toBeInTheDocument()
  })

  it("shows completed indicator for days with completed card", () => {
    render(<CalendarView year={2026} month={5} cards={cards} />)
    const day4 = screen.getByTestId("day-2026-05-04")
    expect(day4).toHaveAttribute("data-status", "COMPLETED")
  })

  it("shows morning indicator for days with morning-only card", () => {
    render(<CalendarView year={2026} month={5} cards={cards} />)
    const day5 = screen.getByTestId("day-2026-05-05")
    expect(day5).toHaveAttribute("data-status", "MORNING")
  })
})
```

- [ ] **Step 2: Run — verify FAILS**

```powershell
pnpm test:run __tests__/components/dashboard/CalendarView.test.tsx
```

- [ ] **Step 3: Implement CalendarView.tsx**

```tsx
// components/dashboard/CalendarView.tsx
import Link from "next/link"

interface CalendarCard {
  date: Date
  status: "MORNING" | "COMPLETED"
}

interface CalendarViewProps {
  year: number
  month: number  // 1-12
  cards: CalendarCard[]
}

const DAY_LABELS = ["Pn", "Wt", "Śr", "Czw", "Pt", "Sb", "Nd"]

export function CalendarView({ year, month, cards }: CalendarViewProps) {
  const daysInMonth = new Date(year, month, 0).getDate()
  // Day of week for first of month (0=Sun → shift to Mon=0)
  const firstDayRaw = new Date(year, month - 1, 1).getDay()
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1

  const cardMap = new Map(
    cards.map((c) => [
      new Date(c.date).toISOString().split("T")[0],
      c.status,
    ])
  )

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const STATUS_COLORS = {
    COMPLETED: "var(--color-mid)",
    MORNING: "var(--color-gold)",
  }

  return (
    <div>
      <h3
        className="mb-3 font-bold uppercase tracking-wide"
        style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
      >
        {new Date(year, month - 1).toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
      </h3>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center" style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const status = cardMap.get(dateStr)

          return (
            <Link
              key={dateStr}
              href={`/cards/${dateStr}/morning/1`}
              data-testid={`day-${dateStr}`}
              data-status={status ?? "none"}
              className="flex items-center justify-center rounded aspect-square text-center transition-colors"
              style={{
                fontSize: "var(--font-size-tiny)",
                background: status ? STATUS_COLORS[status] : "var(--color-light)",
                color: status ? "var(--color-white)" : "var(--color-text)",
              }}
            >
              {day}
            </Link>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3">
        {[
          { color: "var(--color-mid)", label: "Ukończona" },
          { color: "var(--color-gold)", label: "Sesja poranna" },
          { color: "var(--color-light)", label: "Brak karty" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run — verify PASSES**

```powershell
pnpm test:run __tests__/components/dashboard/CalendarView.test.tsx
```

- [ ] **Step 5: Commit**

```powershell
git add components/dashboard/CalendarView.tsx __tests__/components/dashboard/CalendarView.test.tsx
git commit -m "feat: CalendarView component (TDD) — monthly grid with card status"
```

---

## Task 24: Dashboard page

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/dashboard/page.tsx`
- Create: `components/dashboard/HistoryList.tsx`
- Create: `components/dashboard/PrimaryAction.tsx`

- [ ] **Step 1: Create app/(app)/layout.tsx — protected layout**

```tsx
// app/(app)/layout.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  return <>{children}</>
}
```

- [ ] **Step 2: Create components/dashboard/PrimaryAction.tsx**

```tsx
// components/dashboard/PrimaryAction.tsx
import Link from "next/link"

interface PrimaryActionProps {
  dateStr: string  // today's date "YYYY-MM-DD"
  status: "none" | "MORNING" | "COMPLETED"
}

export function PrimaryAction({ dateStr, status }: PrimaryActionProps) {
  const configs = {
    none: {
      label: "Rozpocznij kartę dzienną",
      href: `/cards/${dateStr}/morning/1`,
      bg: "var(--color-mid)",
    },
    MORNING: {
      label: "Wróć do sesji wieczornej →",
      href: `/cards/${dateStr}/evening/6`,
      bg: "var(--color-gold)",
    },
    COMPLETED: {
      label: "Pobierz PDF dzisiejszej karty",
      href: `/api/cards/${dateStr}/pdf`,
      bg: "var(--color-dark)",
    },
  }

  const { label, href, bg } = configs[status]

  return (
    <Link
      href={href}
      className="block text-center px-6 py-3 rounded font-medium"
      style={{ background: bg, color: "var(--color-white)", fontSize: 14 }}
    >
      {label}
    </Link>
  )
}
```

- [ ] **Step 3: Create components/dashboard/HistoryList.tsx**

```tsx
// components/dashboard/HistoryList.tsx
import Link from "next/link"

interface CardSummary {
  date: Date
  status: "MORNING" | "COMPLETED"
}

interface HistoryListProps {
  cards: CardSummary[]
}

const STATUS_LABEL = {
  COMPLETED: "✅ Ukończona",
  MORNING: "🌅 Sesja poranna",
}

export function HistoryList({ cards }: HistoryListProps) {
  if (cards.length === 0) {
    return (
      <p style={{ color: "var(--color-muted)", fontSize: "var(--font-size-body)", fontStyle: "italic" }}>
        Brak poprzednich kart.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {cards.map((card) => {
        const dateStr = new Date(card.date).toISOString().split("T")[0]
        const displayDate = new Date(card.date).toLocaleDateString("pl-PL", {
          weekday: "short", day: "2-digit", month: "2-digit",
        })

        return (
          <li
            key={dateStr}
            className="flex items-center justify-between py-2 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: "var(--font-size-body)", color: "var(--color-text)" }}>
                {displayDate}
              </span>
              <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
                {STATUS_LABEL[card.status]}
              </span>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/cards/${dateStr}/morning/1`}
                style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-mid)" }}
              >
                Podgląd
              </Link>
              {card.status === "COMPLETED" && (
                <a
                  href={`/api/cards/${dateStr}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-gold)" }}
                >
                  PDF
                </a>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 4: Create app/(app)/dashboard/page.tsx**

```tsx
// app/(app)/dashboard/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getYesterdayLesson } from "@/lib/bridges"
import { LessonBanner } from "@/components/dashboard/LessonBanner"
import { CalendarView } from "@/components/dashboard/CalendarView"
import { HistoryList } from "@/components/dashboard/HistoryList"
import { PrimaryAction } from "@/components/dashboard/PrimaryAction"
import { signOut } from "@/auth"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user.id

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split("T")[0]

  // Today's card status
  const todayCard = await prisma.dailyCard.findUnique({
    where: { userId_date: { userId, date: today } },
    select: { status: true, yesterdayLesson: true },
  })

  // Yesterday's lesson (for banner — shown after morning session)
  const lessonForBanner =
    todayCard?.status === "MORNING" || todayCard?.status === "COMPLETED"
      ? todayCard.yesterdayLesson
      : null

  // Month cards for calendar
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

  // Recent history (last 14 days, excluding today)
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
        {/* Yesterday's lesson banner */}
        {lessonForBanner && <LessonBanner lesson={lessonForBanner} />}

        {/* Primary action */}
        <PrimaryAction
          dateStr={todayStr}
          status={todayCard?.status ?? "none"}
        />

        {/* Calendar */}
        <section>
          <CalendarView
            year={now.getFullYear()}
            month={now.getMonth() + 1}
            cards={monthCards}
          />
        </section>

        {/* History */}
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
```

- [ ] **Step 5: Commit**

```powershell
git add app/(app)/ components/dashboard/
git commit -m "feat: dashboard — primary action, lesson banner, calendar, history list"
```

---

## Task 25: Auth pages — Login + Register

**Files:**
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `components/auth/LoginForm.tsx`
- Create: `components/auth/RegisterForm.tsx`

- [ ] **Step 1: Create app/(auth)/layout.tsx**

```tsx
// app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="w-full rounded-lg border p-8"
        style={{
          maxWidth: 360,
          background: "var(--color-white)",
          borderColor: "var(--color-border)",
        }}
      >
        <p
          className="text-center font-bold uppercase tracking-widest mb-6"
          style={{ color: "var(--color-gold)", fontSize: "var(--font-size-tiny)" }}
        >
          THE FORGE
        </p>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create components/auth/LoginForm.tsx**

```tsx
// components/auth/LoginForm.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { loginUser } from "@/actions/auth"

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await loginUser(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%",
    border: `1px solid var(--color-border)`,
    borderRadius: 4,
    padding: "8px 10px",
    fontSize: "var(--font-size-body)",
    fontFamily: "var(--font-family)",
    outline: "none",
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-center font-bold" style={{ fontSize: 16, color: "var(--color-dark)" }}>
        Zaloguj się
      </h1>

      {error && (
        <p className="text-center text-sm" style={{ color: "#dc2626" }}>{error}</p>
      )}

      <div className="flex flex-col gap-1">
        <label style={{ fontSize: "var(--font-size-label)", color: "var(--color-muted)" }}>Email</label>
        <input type="email" name="email" required autoComplete="email" style={inputStyle} />
      </div>

      <div className="flex flex-col gap-1">
        <label style={{ fontSize: "var(--font-size-label)", color: "var(--color-muted)" }}>Hasło</label>
        <input type="password" name="password" required autoComplete="current-password" style={inputStyle} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="py-2 rounded font-medium"
        style={{
          background: "var(--color-mid)",
          color: "var(--color-white)",
          fontSize: "var(--font-size-body)",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Logowanie..." : "Zaloguj"}
      </button>

      <p className="text-center" style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
        Nie masz konta?{" "}
        <Link href="/register" style={{ color: "var(--color-mid)" }}>Zarejestruj się</Link>
      </p>
    </form>
  )
}
```

- [ ] **Step 3: Create components/auth/RegisterForm.tsx** (same pattern)

```tsx
// components/auth/RegisterForm.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { registerUser } from "@/actions/auth"

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await registerUser(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%",
    border: `1px solid var(--color-border)`,
    borderRadius: 4,
    padding: "8px 10px",
    fontSize: "var(--font-size-body)",
    fontFamily: "var(--font-family)",
    outline: "none",
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-center font-bold" style={{ fontSize: 16, color: "var(--color-dark)" }}>
        Utwórz konto
      </h1>

      {error && (
        <p className="text-center text-sm" style={{ color: "#dc2626" }}>{error}</p>
      )}

      <div className="flex flex-col gap-1">
        <label style={{ fontSize: "var(--font-size-label)", color: "var(--color-muted)" }}>Email</label>
        <input type="email" name="email" required autoComplete="email" style={inputStyle} />
      </div>

      <div className="flex flex-col gap-1">
        <label style={{ fontSize: "var(--font-size-label)", color: "var(--color-muted)" }}>Hasło (min. 8 znaków)</label>
        <input type="password" name="password" required minLength={8} autoComplete="new-password" style={inputStyle} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="py-2 rounded font-medium"
        style={{
          background: "var(--color-mid)",
          color: "var(--color-white)",
          fontSize: "var(--font-size-body)",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Tworzę konto..." : "Zarejestruj"}
      </button>

      <p className="text-center" style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
        Masz już konto?{" "}
        <Link href="/login" style={{ color: "var(--color-mid)" }}>Zaloguj się</Link>
      </p>
    </form>
  )
}
```

- [ ] **Step 4: Create auth pages**

```tsx
// app/(auth)/login/page.tsx
import { LoginForm } from "@/components/auth/LoginForm"
export default function LoginPage() { return <LoginForm /> }
```

```tsx
// app/(auth)/register/page.tsx
import { RegisterForm } from "@/components/auth/RegisterForm"
export default function RegisterPage() { return <RegisterForm /> }
```

- [ ] **Step 5: Commit**

```powershell
git add app/\(auth\)/ components/auth/
git commit -m "feat: login + register pages with Auth.js"
```

---

## Task 26: Landing page + root layout

**Files:**
- Create: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update app/layout.tsx**

```tsx
// app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "The Forge",
  description: "Prawdziwi traderzy są wykuwani w ogniu.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Create app/page.tsx — landing page**

```tsx
// app/page.tsx
import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function LandingPage() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: "var(--color-dark)" }}
    >
      <p
        className="font-bold uppercase tracking-widest mb-4"
        style={{ color: "var(--color-gold)", fontSize: "var(--font-size-tiny)", letterSpacing: "4px" }}
      >
        THE FORGE
      </p>
      <h1
        className="font-bold mb-4"
        style={{ color: "var(--color-white)", fontSize: 28, lineHeight: 1.3 }}
      >
        Prawdziwi traderzy<br />są wykuwani w ogniu.
      </h1>
      <p
        className="mb-8 max-w-sm"
        style={{ color: "var(--color-muted)", fontSize: "var(--font-size-body)", lineHeight: 1.6 }}
      >
        System transformacji tradera. 5 warstw refleksji — od dziennej do rocznej.
      </p>
      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 240 }}>
        <Link
          href="/register"
          className="block py-3 rounded font-medium"
          style={{ background: "var(--color-gold)", color: "var(--color-white)", fontSize: 14 }}
        >
          Zacznij swoją praktykę
        </Link>
        <Link
          href="/login"
          className="block py-3 rounded"
          style={{ border: `1px solid var(--color-muted)`, color: "var(--color-muted)", fontSize: 14 }}
        >
          Zaloguj się
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```powershell
git add app/layout.tsx app/page.tsx
git commit -m "feat: landing page (dark navy, gold CTA)"
```

---

## Task 27: Railway deployment

**Files:**
- Create: `railway.json`

- [ ] **Step 1: Create railway.json**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "pnpm dlx prisma migrate deploy && pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

- [ ] **Step 2: Push to GitHub**

```powershell
git remote add origin https://github.com/YOUR_USERNAME/the-forge.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Deploy on Railway**

1. Go to `railway.app` → New Project → Deploy from GitHub repo
2. Select `the-forge` repository
3. Add PostgreSQL plugin: `+ New` → `Database` → `Add PostgreSQL`
4. Set environment variables in Railway dashboard:
   ```
   NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
   NEXTAUTH_URL=https://<your-railway-domain>
   ```
   `DATABASE_URL` is automatically set by Railway PostgreSQL plugin.
5. Deploy → watch logs for successful migration + build

- [ ] **Step 4: Verify deployment**

Visit your Railway URL. Expected:
- Landing page loads with dark navy background + gold title
- Register creates an account
- Login redirects to dashboard
- Daily card wizard works end-to-end
- PDF downloads after completing a card

- [ ] **Step 5: Final commit**

```powershell
git add railway.json
git commit -m "chore: Railway deployment config"
git push
```

---

## Phase 1 MVP — Done checklist

- [ ] User can register, log in, log out
- [ ] Morning Daily Card (steps 1–5) saves and shows "Idę tradować" screen
- [ ] Yesterday's lesson (Bridge 1) appears automatically at top of next day's card
- [ ] Evening Daily Card (steps 6–15) completes and marks card COMPLETED
- [ ] "Zakończ dzień" generates PDF download
- [ ] Dashboard shows primary action button, lesson banner, calendar, history list
- [ ] Calendar shows month grid with colored status indicators
- [ ] Bridge 2 items from Weekly Review appear as suggestions in Step 5 pre-mortem
- [ ] All data isolated per user — no cross-user visibility
- [ ] App runs on Railway with PostgreSQL
- [ ] Landing page visible to unauthenticated users

**Stop here. Fill the daily card for 2 weeks. Real usage will reveal more than any additional feature.**
