# The Forge — Phase 1 MVP: Part 2 — Daily Card Wizard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Daily Card wizard — morning session (steps 1–5), evening session (steps 6–15), Bridge 1 (yesterday's lesson), Bridge 2 (weekly pre-mortem suggestions), and auto-save after every step.

**Prerequisite:** Part 1 complete (project initialized, auth working, design system components built).

**Route pattern:**
- Morning: `/cards/[date]/morning/[step]` where step = 1–5
- Evening: `/cards/[date]/evening/[step]` where step = 6–15
- Complete: `/cards/[date]/complete`

**Continues from:** `2026-05-05-phase1-part1-foundation.md`
**Continues in:** `2026-05-05-phase1-part3-completion.md`

---

## File Map (Part 2)

```
WEB/
├── lib/
│   └── bridges.ts
├── actions/
│   ├── cards.ts
│   ├── trades.ts
│   └── emotions.ts
├── components/
│   └── wizard/
│       ├── WizardLayout.tsx
│       └── steps/
│           ├── morning/
│           │   ├── Step1Lesson.tsx
│           │   ├── Step2PersonalContext.tsx
│           │   ├── Step3MarketContext.tsx
│           │   ├── Step4DailyPlan.tsx
│           │   └── Step5PreMortem.tsx
│           └── evening/
│               ├── Step6TradeLog.tsx
│               ├── Step7EmotionLog.tsx
│               ├── Step8AreaScores.tsx
│               ├── Step9Strengths.tsx
│               ├── Step10Implementation.tsx
│               ├── Step11MentalState.tsx
│               ├── Step12Practice.tsx
│               ├── Step13Evaluation.tsx
│               ├── Step14Identity.tsx
│               └── Step15Tomorrow.tsx
└── app/
    └── (app)/
        └── cards/
            └── [date]/
                ├── morning/
                │   └── [step]/
                │       └── page.tsx
                ├── evening/
                │   └── [step]/
                │       └── page.tsx
                └── complete/
                    └── page.tsx
```

---

## Task 12: Bridge query functions (TDD)

**Files:**
- Create: `lib/bridges.ts`
- Create: `__tests__/lib/bridges.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/lib/bridges.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  prisma: {
    dailyCard: { findFirst: vi.fn() },
    weeklyReview: { findFirst: vi.fn() },
  },
}))

import { prisma } from "@/lib/db"
import { getYesterdayLesson, getLastWeekLesson, getBridge2Items } from "@/lib/bridges"

describe("getYesterdayLesson", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns tomorrowRemember from most recent previous card", async () => {
    vi.mocked(prisma.dailyCard.findFirst).mockResolvedValue({
      tomorrowRemember: "Nie wchodź w C-setup po 14:00",
    } as any)

    const result = await getYesterdayLesson("user-1", new Date("2026-05-06"))

    expect(prisma.dailyCard.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        date: { lt: new Date("2026-05-06") },
        tomorrowRemember: { not: null },
      },
      orderBy: { date: "desc" },
      select: { tomorrowRemember: true },
    })
    expect(result).toBe("Nie wchodź w C-setup po 14:00")
  })

  it("returns null when no previous card exists", async () => {
    vi.mocked(prisma.dailyCard.findFirst).mockResolvedValue(null)
    expect(await getYesterdayLesson("user-1", new Date("2026-05-06"))).toBeNull()
  })
})

describe("getLastWeekLesson", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns bridgeStrategicTopic from most recent weekly review", async () => {
    vi.mocked(prisma.weeklyReview.findFirst).mockResolvedValue({
      bridgeStrategicTopic: "Focusuj się tylko na A-setupach",
    } as any)

    const result = await getLastWeekLesson("user-1", new Date("2026-05-06"))
    expect(result).toBe("Focusuj się tylko na A-setupach")
  })

  it("returns null when no weekly review exists", async () => {
    vi.mocked(prisma.weeklyReview.findFirst).mockResolvedValue(null)
    expect(await getLastWeekLesson("user-1", new Date("2026-05-06"))).toBeNull()
  })
})

describe("getBridge2Items", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns bridgePreMortemItems array from most recent weekly review", async () => {
    vi.mocked(prisma.weeklyReview.findFirst).mockResolvedValue({
      bridgePreMortemItems: ["Nie revenge trade", "Stop przed newsami", "Max 3 trades/dzień"],
    } as any)

    const result = await getBridge2Items("user-1", new Date("2026-05-06"))
    expect(result).toEqual(["Nie revenge trade", "Stop przed newsami", "Max 3 trades/dzień"])
  })

  it("returns empty array when no weekly review exists", async () => {
    vi.mocked(prisma.weeklyReview.findFirst).mockResolvedValue(null)
    expect(await getBridge2Items("user-1", new Date("2026-05-06"))).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests — verify FAIL**

```powershell
pnpm test:run __tests__/lib/bridges.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/bridges'`

- [ ] **Step 3: Implement lib/bridges.ts**

```typescript
// lib/bridges.ts
import { prisma } from "@/lib/db"

export async function getYesterdayLesson(userId: string, date: Date): Promise<string | null> {
  const card = await prisma.dailyCard.findFirst({
    where: {
      userId,
      date: { lt: date },
      tomorrowRemember: { not: null },
    },
    orderBy: { date: "desc" },
    select: { tomorrowRemember: true },
  })
  return card?.tomorrowRemember ?? null
}

export async function getLastWeekLesson(userId: string, date: Date): Promise<string | null> {
  const weekly = await prisma.weeklyReview.findFirst({
    where: {
      userId,
      weekEnd: { lt: date },
      bridgeStrategicTopic: { not: null },
    },
    orderBy: { weekEnd: "desc" },
    select: { bridgeStrategicTopic: true },
  })
  return weekly?.bridgeStrategicTopic ?? null
}

export async function getBridge2Items(userId: string, date: Date): Promise<string[]> {
  const weekly = await prisma.weeklyReview.findFirst({
    where: {
      userId,
      weekEnd: { lt: date },
      bridgePreMortemItems: { not: null },
    },
    orderBy: { weekEnd: "desc" },
    select: { bridgePreMortemItems: true },
  })
  return (weekly?.bridgePreMortemItems as string[]) ?? []
}
```

- [ ] **Step 4: Run tests — verify PASS**

```powershell
pnpm test:run __tests__/lib/bridges.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```powershell
git add lib/bridges.ts __tests__/lib/bridges.test.ts
git commit -m "feat: bridge query functions (TDD) — Bridge 1 + Bridge 2"
```

---

## Task 13: Daily Card Server Actions

**Files:**
- Create: `actions/cards.ts`
- Create: `actions/trades.ts`
- Create: `actions/emotions.ts`

- [ ] **Step 1: Create actions/cards.ts**

```typescript
// actions/cards.ts
"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getYesterdayLesson, getLastWeekLesson } from "@/lib/bridges"
import { revalidatePath } from "next/cache"
import type { CardStatus } from "@prisma/client"

function requireUser() {
  return auth().then((session) => {
    if (!session?.user?.id) throw new Error("Unauthorized")
    return session.user.id
  })
}

export async function getOrCreateDailyCard(dateStr: string) {
  const userId = await requireUser()
  const date = new Date(dateStr)

  const yesterdayLesson = await getYesterdayLesson(userId, date)
  const lastWeekLesson = await getLastWeekLesson(userId, date)

  return prisma.dailyCard.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, yesterdayLesson, lastWeekLesson },
    update: {},
    include: { trades: { orderBy: { createdAt: "asc" } }, emotionEntries: { orderBy: { createdAt: "asc" } } },
  })
}

export async function updateDailyCard(
  id: string,
  data: Partial<{
    sleep: number; energy: number; focus: number; prepQuality: number; moodNotes: string
    trendBias: string; keyLevels: string; macroNews: string; correlations: string
    whatIfs: string; entryConditions: string; tierASetup: string; tierBSetup: string; tierCSetup: string
    preMortem: string; dailyGoal: string
    strengthsUsed: string; improvementWhen: string; improvementThen: string; improvementExtra: string
    mentalAfter: number; whatShapedIt: string; deliberatePractice: string
    processScore: number; pl: string; overallScore: number
    proudOf: string; ashamedOf: string; tomorrowRemember: string
    status: CardStatus
  }>
) {
  const userId = await requireUser()

  const card = await prisma.dailyCard.findFirst({ where: { id, userId } })
  if (!card) throw new Error("Card not found")

  await prisma.dailyCard.update({ where: { id }, data })
  revalidatePath("/dashboard")
}

export async function getDailyCard(dateStr: string) {
  const userId = await requireUser()
  const date = new Date(dateStr)

  return prisma.dailyCard.findUnique({
    where: { userId_date: { userId, date } },
    include: { trades: { orderBy: { createdAt: "asc" } }, emotionEntries: { orderBy: { createdAt: "asc" } } },
  })
}

export async function getDailyCardsByMonth(year: number, month: number) {
  const userId = await requireUser()
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)

  return prisma.dailyCard.findMany({
    where: { userId, date: { gte: start, lte: end } },
    select: { date: true, status: true },
    orderBy: { date: "asc" },
  })
}
```

- [ ] **Step 2: Create actions/trades.ts**

```typescript
// actions/trades.ts
"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function addTrade(
  dailyCardId: string,
  data: {
    time?: string; trigger?: string; setup?: string; direction?: string
    tier?: string; rExpected?: number; rActual?: number; decision?: string
    emotion?: string; lessons?: string
  }
) {
  const userId = await requireUser()
  const card = await prisma.dailyCard.findFirst({ where: { id: dailyCardId, userId } })
  if (!card) throw new Error("Card not found")

  return prisma.trade.create({ data: { dailyCardId, ...data } })
}

export async function updateTrade(
  id: string,
  data: Partial<{ time: string; trigger: string; setup: string; direction: string; tier: string; rExpected: number; rActual: number; decision: string; emotion: string; lessons: string }>
) {
  const userId = await requireUser()
  const trade = await prisma.trade.findFirst({
    where: { id },
    include: { dailyCard: { select: { userId: true } } },
  })
  if (!trade || trade.dailyCard.userId !== userId) throw new Error("Not found")

  return prisma.trade.update({ where: { id }, data })
}

export async function deleteTrade(id: string) {
  const userId = await requireUser()
  const trade = await prisma.trade.findFirst({
    where: { id },
    include: { dailyCard: { select: { userId: true } } },
  })
  if (!trade || trade.dailyCard.userId !== userId) throw new Error("Not found")

  return prisma.trade.delete({ where: { id } })
}
```

- [ ] **Step 3: Create actions/emotions.ts** (same pattern as trades.ts)

```typescript
// actions/emotions.ts
"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function addEmotionEntry(
  dailyCardId: string,
  data: { time?: string; emotion?: string; triggerContext?: string; meaningSignal?: string; reaction?: string }
) {
  const userId = await requireUser()
  const card = await prisma.dailyCard.findFirst({ where: { id: dailyCardId, userId } })
  if (!card) throw new Error("Card not found")

  return prisma.emotionEntry.create({ data: { dailyCardId, ...data } })
}

export async function updateEmotionEntry(id: string, data: Partial<{ time: string; emotion: string; triggerContext: string; meaningSignal: string; reaction: string }>) {
  const userId = await requireUser()
  const entry = await prisma.emotionEntry.findFirst({
    where: { id },
    include: { dailyCard: { select: { userId: true } } },
  })
  if (!entry || entry.dailyCard.userId !== userId) throw new Error("Not found")

  return prisma.emotionEntry.update({ where: { id }, data })
}

export async function deleteEmotionEntry(id: string) {
  const userId = await requireUser()
  const entry = await prisma.emotionEntry.findFirst({
    where: { id },
    include: { dailyCard: { select: { userId: true } } },
  })
  if (!entry || entry.dailyCard.userId !== userId) throw new Error("Not found")

  return prisma.emotionEntry.delete({ where: { id } })
}
```

- [ ] **Step 4: Commit**

```powershell
git add actions/
git commit -m "feat: daily card, trades, emotions Server Actions"
```

---

## Task 14: WizardLayout component

**Files:**
- Create: `components/wizard/WizardLayout.tsx`

- [ ] **Step 1: Create WizardLayout.tsx**

```tsx
// components/wizard/WizardLayout.tsx
import Link from "next/link"

interface WizardLayoutProps {
  children: React.ReactNode
  date: string
  session: "morning" | "evening"
  currentStep: number
  totalSteps: number
  stepLabel: string
  onNext?: () => void
  nextHref?: string
  prevHref?: string
  nextLabel?: string
  nextDisabled?: boolean
}

const MORNING_STEPS = 5
const TOTAL_STEPS = 15

export function WizardLayout({
  children,
  date,
  session,
  currentStep,
  totalSteps,
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
      <div
        className="mx-auto px-4 py-6"
        style={{ maxWidth: "var(--content-max-width)" }}
      >
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
            <Link
              href={prevHref}
              className="text-sm"
              style={{ color: "var(--color-muted)" }}
            >
              ← Wstecz
            </Link>
          ) : <span />}

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
```

- [ ] **Step 2: Commit**

```powershell
git add components/wizard/WizardLayout.tsx
git commit -m "feat: WizardLayout with progress bar, sticky nav"
```

---

## Task 15: Wizard routing — page.tsx files

**Files:**
- Create: `app/(app)/cards/[date]/morning/[step]/page.tsx`
- Create: `app/(app)/cards/[date]/evening/[step]/page.tsx`
- Create: `app/(app)/cards/[date]/complete/page.tsx`

- [ ] **Step 1: Create morning page.tsx — router to step components**

```tsx
// app/(app)/cards/[date]/morning/[step]/page.tsx
import { redirect } from "next/navigation"
import { getOrCreateDailyCard } from "@/actions/cards"
import { getBridge2Items } from "@/lib/bridges"
import { auth } from "@/auth"
import { Step1Lesson } from "@/components/wizard/steps/morning/Step1Lesson"
import { Step2PersonalContext } from "@/components/wizard/steps/morning/Step2PersonalContext"
import { Step3MarketContext } from "@/components/wizard/steps/morning/Step3MarketContext"
import { Step4DailyPlan } from "@/components/wizard/steps/morning/Step4DailyPlan"
import { Step5PreMortem } from "@/components/wizard/steps/morning/Step5PreMortem"

const STEP_COMPONENTS = {
  1: Step1Lesson,
  2: Step2PersonalContext,
  3: Step3MarketContext,
  4: Step4DailyPlan,
  5: Step5PreMortem,
}

export default async function MorningStepPage({
  params,
}: {
  params: { date: string; step: string }
}) {
  const step = parseInt(params.step)
  if (step < 1 || step > 5 || isNaN(step)) redirect(`/cards/${params.date}/morning/1`)

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const card = await getOrCreateDailyCard(params.date)
  if (card.status === "COMPLETED") redirect(`/cards/${params.date}/complete`)

  const bridge2Items = step === 5
    ? await getBridge2Items(session.user.id, new Date(params.date))
    : []

  const StepComponent = STEP_COMPONENTS[step as keyof typeof STEP_COMPONENTS]

  return (
    <StepComponent
      card={card}
      date={params.date}
      step={step}
      bridge2Items={bridge2Items}
    />
  )
}
```

- [ ] **Step 2: Create evening page.tsx**

```tsx
// app/(app)/cards/[date]/evening/[step]/page.tsx
import { redirect } from "next/navigation"
import { getDailyCard } from "@/actions/cards"
import { Step6TradeLog } from "@/components/wizard/steps/evening/Step6TradeLog"
import { Step7EmotionLog } from "@/components/wizard/steps/evening/Step7EmotionLog"
import { Step8AreaScores } from "@/components/wizard/steps/evening/Step8AreaScores"
import { Step9Strengths } from "@/components/wizard/steps/evening/Step9Strengths"
import { Step10Implementation } from "@/components/wizard/steps/evening/Step10Implementation"
import { Step11MentalState } from "@/components/wizard/steps/evening/Step11MentalState"
import { Step12Practice } from "@/components/wizard/steps/evening/Step12Practice"
import { Step13Evaluation } from "@/components/wizard/steps/evening/Step13Evaluation"
import { Step14Identity } from "@/components/wizard/steps/evening/Step14Identity"
import { Step15Tomorrow } from "@/components/wizard/steps/evening/Step15Tomorrow"

const STEP_COMPONENTS = {
  6: Step6TradeLog, 7: Step7EmotionLog, 8: Step8AreaScores,
  9: Step9Strengths, 10: Step10Implementation, 11: Step11MentalState,
  12: Step12Practice, 13: Step13Evaluation, 14: Step14Identity, 15: Step15Tomorrow,
}

export default async function EveningStepPage({
  params,
}: {
  params: { date: string; step: string }
}) {
  const step = parseInt(params.step)
  if (step < 6 || step > 15 || isNaN(step)) redirect(`/cards/${params.date}/evening/6`)

  const card = await getDailyCard(params.date)
  if (!card) redirect(`/cards/${params.date}/morning/1`)
  if (card.status === "COMPLETED") redirect(`/cards/${params.date}/complete`)

  const StepComponent = STEP_COMPONENTS[step as keyof typeof STEP_COMPONENTS]
  return <StepComponent card={card} date={params.date} step={step} />
}
```

- [ ] **Step 3: Create complete page.tsx**

```tsx
// app/(app)/cards/[date]/complete/page.tsx
import Link from "next/link"
import { getDailyCard } from "@/actions/cards"
import { redirect } from "next/navigation"

export default async function CompletePage({ params }: { params: { date: string } }) {
  const card = await getDailyCard(params.date)
  if (!card || card.status !== "COMPLETED") redirect(`/cards/${params.date}/morning/1`)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="text-center">
        <p style={{ color: "var(--color-gold)", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-bold)" }}>
          THE FORGE
        </p>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--color-dark)" }}>
          Dzień ukończony
        </h1>
        <p className="mt-2" style={{ color: "var(--color-muted)", fontSize: "var(--font-size-body)" }}>
          Dobra robota. Karta dzienna zapisana.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 300 }}>
        <a
          href={`/api/cards/${params.date}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center px-4 py-2 rounded font-medium"
          style={{ background: "var(--color-gold)", color: "var(--color-white)" }}
        >
          Pobierz kartę (PDF)
        </a>
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
```

- [ ] **Step 4: Commit**

```powershell
git add app/
git commit -m "feat: wizard routing — morning/evening/complete pages"
```

---

## Task 16: Morning Step 1 — Lessons (Bridge 1 + Bridge 2 preview)

**Files:**
- Create: `components/wizard/steps/morning/Step1Lesson.tsx`

- [ ] **Step 1: Create Step1Lesson.tsx**

```tsx
// components/wizard/steps/morning/Step1Lesson.tsx
"use client"

import { WizardLayout } from "@/components/wizard/WizardLayout"
import { BridgeIndicator } from "@/components/forge"
import type { DailyCard } from "@prisma/client"

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: any[] }
  date: string
  step: number
  bridge2Items: string[]
}

export function Step1Lesson({ card, date, step, bridge2Items }: Props) {
  return (
    <WizardLayout
      date={date}
      session="morning"
      currentStep={step}
      totalSteps={15}
      stepLabel="Lekcje"
      prevHref="/dashboard"
      nextHref={`/cards/${date}/morning/2`}
    >
      <div className="flex flex-col gap-6">
        {/* Yesterday's lesson */}
        <div>
          <BridgeIndicator source="z wczorajszej karty" />
          <p
            className="mb-2 font-medium uppercase tracking-wide"
            style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
          >
            LEKCJA Z WCZORAJ:
          </p>
          {card.yesterdayLesson ? (
            <p
              className="px-4 py-3 rounded"
              style={{
                background: "var(--color-light)",
                borderLeft: `3px solid var(--color-gold)`,
                fontSize: "var(--font-size-body)",
                color: "var(--color-text)",
              }}
            >
              {card.yesterdayLesson}
            </p>
          ) : (
            <p style={{ color: "var(--color-muted)", fontSize: "var(--font-size-body)", fontStyle: "italic" }}>
              Brak lekcji — to Twój pierwszy dzień w systemie.
            </p>
          )}
        </div>

        {/* Last week's lesson */}
        {card.lastWeekLesson && (
          <div>
            <BridgeIndicator source="z poprzedniego Weekly Review" />
            <p
              className="mb-2 font-medium uppercase tracking-wide"
              style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
            >
              LEKCJA Z POPRZ. TYGODNIA (Weekly Review):
            </p>
            <p
              className="px-4 py-3 rounded"
              style={{
                background: "var(--color-light)",
                borderLeft: `3px solid var(--color-mid)`,
                fontSize: "var(--font-size-body)",
                color: "var(--color-text)",
              }}
            >
              {card.lastWeekLesson}
            </p>
          </div>
        )}

        {/* Bridge 2 preview (coming in step 5) */}
        {bridge2Items.length > 0 && (
          <div>
            <p
              className="mb-2 font-medium uppercase tracking-wide"
              style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
            >
              PRIORYTETY Z WEEKLY REVIEW (pojawią się w pre-mortem):
            </p>
            <ul className="flex flex-col gap-1">
              {bridge2Items.map((item, i) => (
                <li
                  key={i}
                  style={{ fontSize: "var(--font-size-body)", color: "var(--color-muted)", fontStyle: "italic" }}
                >
                  {i + 1}. {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </WizardLayout>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
git add components/wizard/steps/morning/Step1Lesson.tsx
git commit -m "feat: wizard Step 1 — lessons (Bridge 1 + Bridge 2 preview)"
```

---

## Task 17: Morning Steps 2–5

Each step follows the same pattern:
1. Client component receives `card`, `date`, `step` props
2. Local state mirrors the card fields for that step
3. "Dalej" button calls `updateDailyCard(card.id, {...fields})` then navigates via `router.push`
4. Wraps content in `<WizardLayout>`

**Files:**
- Create: `components/wizard/steps/morning/Step2PersonalContext.tsx`
- Create: `components/wizard/steps/morning/Step3MarketContext.tsx`
- Create: `components/wizard/steps/morning/Step4DailyPlan.tsx`
- Create: `components/wizard/steps/morning/Step5PreMortem.tsx`

- [ ] **Step 1: Create Step2PersonalContext.tsx**

```tsx
// components/wizard/steps/morning/Step2PersonalContext.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, DotRow, TextArea } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import type { DailyCard } from "@prisma/client"

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: any[] }
  date: string
  step: number
}

export function Step2PersonalContext({ card, date, step }: Props) {
  const router = useRouter()
  const [sleep, setSleep] = useState<number | null>(card.sleep)
  const [energy, setEnergy] = useState<number | null>(card.energy)
  const [focus, setFocus] = useState<number | null>(card.focus)
  const [prepQuality, setPrepQuality] = useState<number | null>(card.prepQuality)
  const [moodNotes, setMoodNotes] = useState(card.moodNotes ?? "")
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateDailyCard(card.id, {
      sleep: sleep ?? undefined,
      energy: energy ?? undefined,
      focus: focus ?? undefined,
      prepQuality: prepQuality ?? undefined,
      moodNotes,
    })
    router.push(`/cards/${date}/morning/3`)
  }

  return (
    <WizardLayout
      date={date}
      session="morning"
      currentStep={step}
      totalSteps={15}
      stepLabel="Kontekst osobisty"
      prevHref={`/cards/${date}/morning/1`}
      nextHref={`/cards/${date}/morning/3`}
      nextLabel={saving ? "Zapisuję..." : "Dalej →"}
      nextDisabled={saving}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="1" title="KONTEKST OSOBISTY (RANO)" />
        <div className="flex flex-col gap-1 py-2">
          <DotRow label="Sen:" value={sleep} onChange={setSleep} />
          <DotRow label="Energia:" value={energy} onChange={setEnergy} />
          <DotRow label="Fokus:" value={focus} onChange={setFocus} />
          <DotRow label="Jakość przygotowania:" value={prepQuality} onChange={setPrepQuality} />
        </div>
        <TextArea label="Nastrój / notatki:" value={moodNotes} onChange={setMoodNotes} rows={5} />
      </div>

      {/* Override next button to save first */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white" style={{ borderColor: "var(--color-border)" }}>
        <div className="mx-auto px-4 py-3 flex justify-between" style={{ maxWidth: "var(--content-max-width)" }}>
          <a href={`/cards/${date}/morning/1`} style={{ color: "var(--color-muted)", fontSize: 14 }}>← Wstecz</a>
          <button
            onClick={handleNext}
            disabled={saving}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ background: "var(--color-mid)", color: "var(--color-white)", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Zapisuję..." : "Dalej →"}
          </button>
        </div>
      </div>
    </WizardLayout>
  )
}
```

- [ ] **Step 2: Create Step3MarketContext.tsx** (same pattern, different fields)

Fields: `trendBias` (TextInput), `keyLevels` (TextArea, 3 rows), `macroNews` (TextInput), `correlations` (TextInput).
Section header: `<SectionHeader number="2" title="KONTEKST RYNKOWY" />`
Saves: `{ trendBias, keyLevels, macroNews, correlations }`
prevHref: `/cards/${date}/morning/2`, nextHref: `/cards/${date}/morning/4`

- [ ] **Step 3: Create Step4DailyPlan.tsx** (same pattern)

Fields: `whatIfs` (TextArea, 4 rows), `entryConditions` (TextArea, 3 rows), `tierASetup` (TextInput), `tierBSetup` (TextInput), `tierCSetup` (TextInput).
Section header: `<SectionHeader number="3" title="PLAN DNIA" />`
Note: Below tiers, add static text: `"A = 100% wielkości · B = 50% · C = 25%"` in muted tiny font.
Saves: `{ whatIfs, entryConditions, tierASetup, tierBSetup, tierCSetup }`
prevHref: `/cards/${date}/morning/3`, nextHref: `/cards/${date}/morning/5`

- [ ] **Step 4: Create Step5PreMortem.tsx** (includes Bridge 2 items)

```tsx
// components/wizard/steps/morning/Step5PreMortem.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, TextArea, BridgeIndicator } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import type { DailyCard } from "@prisma/client"

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: any[] }
  date: string
  step: number
  bridge2Items: string[]
}

export function Step5PreMortem({ card, date, step, bridge2Items }: Props) {
  const router = useRouter()
  const [preMortem, setPreMortem] = useState(card.preMortem ?? "")
  const [dailyGoal, setDailyGoal] = useState(card.dailyGoal ?? "")
  const [saving, setSaving] = useState(false)

  function applyBridgeItems() {
    const text = bridge2Items.map((item, i) => `${i + 1}. ${item}`).join("\n")
    setPreMortem((prev) => (prev ? `${prev}\n${text}` : text))
  }

  async function handleGoTrade() {
    setSaving(true)
    await updateDailyCard(card.id, { preMortem, dailyGoal, status: "MORNING" })
    router.push("/dashboard")
  }

  return (
    <WizardLayout
      date={date}
      session="morning"
      currentStep={step}
      totalSteps={15}
      stepLabel="Pre-mortem"
      prevHref={`/cards/${date}/morning/4`}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="4" title="PRE-MORTEM" />

        {bridge2Items.length > 0 && (
          <div>
            <BridgeIndicator source="z ostatniego Weekly Review" />
            <button
              type="button"
              onClick={applyBridgeItems}
              className="text-sm px-3 py-1 rounded mb-2"
              style={{ background: "var(--color-light)", color: "var(--color-mid)", border: `1px solid var(--color-gold)` }}
            >
              ↗ Wstaw sugestie z Weekly Review
            </button>
          </div>
        )}

        <TextArea
          label="Co mogę dziś zepsuć?"
          value={preMortem}
          onChange={setPreMortem}
          rows={6}
        />
        <TextArea label="Cel dzienny:" value={dailyGoal} onChange={setDailyGoal} rows={2} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-white" style={{ borderColor: "var(--color-border)" }}>
        <div className="mx-auto px-4 py-3 flex justify-between" style={{ maxWidth: "var(--content-max-width)" }}>
          <a href={`/cards/${date}/morning/4`} style={{ color: "var(--color-muted)", fontSize: 14 }}>← Wstecz</a>
          <button
            onClick={handleGoTrade}
            disabled={saving}
            className="px-6 py-2 rounded font-medium"
            style={{ background: "var(--color-gold)", color: "var(--color-white)", fontSize: 14 }}
          >
            {saving ? "Zapisuję..." : "Idę tradować →"}
          </button>
        </div>
      </div>
    </WizardLayout>
  )
}
```

- [ ] **Step 5: Commit**

```powershell
git add components/wizard/steps/morning/
git commit -m "feat: morning wizard steps 2-5 (personal context, market, plan, pre-mortem)"
```

---

## Task 18: Evening Steps 6–7 — Trade log + Emotion log

**Files:**
- Create: `components/wizard/steps/evening/Step6TradeLog.tsx`
- Create: `components/wizard/steps/evening/Step7EmotionLog.tsx`

- [ ] **Step 1: Create Step6TradeLog.tsx**

```tsx
// components/wizard/steps/evening/Step6TradeLog.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, TableInput } from "@/components/forge"
import { addTrade, updateTrade, deleteTrade } from "@/actions/trades"
import type { DailyCard, Trade } from "@prisma/client"

const TRADE_COLUMNS = [
  { id: "time",      label: "Czas",   width: "7%" },
  { id: "trigger",   label: "Trigger",width: "13%" },
  { id: "setup",     label: "Setup",  width: "15%" },
  { id: "direction", label: "Kier.",  width: "8%", type: "select" as const, options: ["long", "short"] },
  { id: "tier",      label: "Tier",   width: "8%", type: "select" as const, options: ["A", "B", "C"] },
  { id: "rExpected", label: "R plan.",width: "9%", type: "number" as const },
  { id: "rActual",   label: "R real.",width: "9%", type: "number" as const },
  { id: "emotion",   label: "Emocja", width: "13%" },
  { id: "lessons",   label: "Lekcje", width: "18%" },
]

interface Props {
  card: DailyCard & { trades: Trade[]; emotionEntries: any[] }
  date: string
  step: number
}

export function Step6TradeLog({ card, date, step }: Props) {
  const router = useRouter()
  const [trades, setTrades] = useState(card.trades)

  async function handleAddRow() {
    const newTrade = await addTrade(card.id, {})
    setTrades((prev) => [...prev, newTrade])
  }

  async function handleUpdateRow(index: number, field: string, value: string | number) {
    const trade = trades[index]
    if (!trade) return
    await updateTrade(trade.id, { [field]: value } as any)
    setTrades((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    )
  }

  return (
    <WizardLayout
      date={date}
      session="evening"
      currentStep={step}
      totalSteps={15}
      stepLabel="Log transakcji"
      prevHref="/dashboard"
      nextHref={`/cards/${date}/evening/7`}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="5" title="LOG TRANSAKCJI" />
        <TableInput
          columns={TRADE_COLUMNS}
          rows={trades}
          onAddRow={handleAddRow}
          onUpdateRow={handleUpdateRow}
          addLabel="+ Dodaj transakcję"
          emptyRows={5}
        />
      </div>
    </WizardLayout>
  )
}
```

- [ ] **Step 2: Create Step7EmotionLog.tsx** (same pattern)

Columns: `time` (7%), `emotion` (15%), `triggerContext` (22%), `meaningSignal` (22%), `reaction` (22% — "Reakcja").
Uses `addEmotionEntry`, `updateEmotionEntry` from `@/actions/emotions`.
Section header: `<SectionHeader number="6" title="LOG EMOCJI" />`
emptyRows: 4, addLabel: "+ Dodaj emocję"
prevHref: `/cards/${date}/evening/6`, nextHref: `/cards/${date}/evening/8`

- [ ] **Step 3: Commit**

```powershell
git add components/wizard/steps/evening/Step6TradeLog.tsx components/wizard/steps/evening/Step7EmotionLog.tsx
git commit -m "feat: evening steps 6-7 — trade log + emotion log tables"
```

---

## Task 19: Evening Steps 8–12

Each step follows the save-then-navigate pattern from Step 2. Full list:

**Files:**
- Create: `components/wizard/steps/evening/Step8AreaScores.tsx`
- Create: `components/wizard/steps/evening/Step9Strengths.tsx`
- Create: `components/wizard/steps/evening/Step10Implementation.tsx`
- Create: `components/wizard/steps/evening/Step11MentalState.tsx`
- Create: `components/wizard/steps/evening/Step12Practice.tsx`

- [ ] **Step 1: Create Step8AreaScores.tsx**

```tsx
// components/wizard/steps/evening/Step8AreaScores.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, DotRow } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import type { DailyCard } from "@prisma/client"

interface Props { card: DailyCard & { trades: any[]; emotionEntries: any[] }; date: string; step: number }

export function Step8AreaScores({ card, date, step }: Props) {
  const router = useRouter()
  const [setups, setSetups] = useState<number | null>(card.sleep) // placeholder — will hold scores
  const [execution, setExecution] = useState<number | null>(null)
  const [riskManagement, setRiskManagement] = useState<number | null>(null)
  const [psychology, setPsychology] = useState<number | null>(null)
  const [discipline, setDiscipline] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // Note: area scores are stored as separate fields; add them to schema if not present.
  // For MVP store as JSON in a single field or add individual columns.
  // Recommended: add setupsScore, executionScore, riskScore, psychologyScore, disciplineScore to schema.

  async function handleNext() {
    setSaving(true)
    // updateDailyCard(card.id, { setupsScore: setups, executionScore: execution, ... })
    router.push(`/cards/${date}/evening/9`)
  }

  return (
    <WizardLayout
      date={date} session="evening" currentStep={step} totalSteps={15}
      stepLabel="Oceny obszarów"
      prevHref={`/cards/${date}/evening/7`}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="7" title="OCENY OBSZARÓW" />
        <div className="flex flex-col gap-1 py-2">
          <DotRow label="Setupy:" value={setups} onChange={setSetups} />
          <DotRow label="Egzekucja:" value={execution} onChange={setExecution} />
          <DotRow label="Zarządzanie ryzykiem:" value={riskManagement} onChange={setRiskManagement} />
          <DotRow label="Psychologia:" value={psychology} onChange={setPsychology} />
          <DotRow label="Dyscyplina:" value={discipline} onChange={setDiscipline} />
        </div>
        <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", fontStyle: "italic" }}>
          1 = naruszenie zasad · 3 = poprawnie ale automatycznie · 5 = świadomie i zgodnie z planem
        </p>
      </div>
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white" style={{ borderColor: "var(--color-border)" }}>
        <div className="mx-auto px-4 py-3 flex justify-between" style={{ maxWidth: "var(--content-max-width)" }}>
          <a href={`/cards/${date}/evening/7`} style={{ color: "var(--color-muted)", fontSize: 14 }}>← Wstecz</a>
          <button onClick={handleNext} disabled={saving} className="px-4 py-2 rounded text-sm font-medium" style={{ background: "var(--color-mid)", color: "var(--color-white)" }}>
            {saving ? "Zapisuję..." : "Dalej →"}
          </button>
        </div>
      </div>
    </WizardLayout>
  )
}
```

**Schema note for Step 8:** Before implementing Step 8, add 5 score columns to `schema.prisma` and run a new migration:
```prisma
setupsScore      Int?
executionScore   Int?
riskScore        Int?
psychologyScore  Int?
disciplineScore  Int?
```
```powershell
pnpm dlx prisma migrate dev --name add_area_scores
```

- [ ] **Step 2: Create Step9Strengths.tsx**

Single `TextArea` (6 rows): `strengthsUsed`.
Section header: `<SectionHeader number="8" title="SILNE STRONY W AKCJI" />`
Saves: `{ strengthsUsed }`
prevHref: `/cards/${date}/evening/8`, nextHref: `/cards/${date}/evening/10`

- [ ] **Step 3: Create Step10Implementation.tsx**

Uses `<ImplementationIntention>` component.
Section header: `<SectionHeader number="9" title="JEDNA RZECZ DO POPRAWY" />`
Fields: `improvementWhen`, `improvementThen`, `improvementExtra`.
Saves: `{ improvementWhen, improvementThen, improvementExtra }`
prevHref: `/cards/${date}/evening/9`, nextHref: `/cards/${date}/evening/11`

- [ ] **Step 4: Create Step11MentalState.tsx**

Fields: `<DotRow label="Stan mentalny po sesji:" />` (mentalAfter) + `<TextArea>` (whatShapedIt, 4 rows).
Section header: `<SectionHeader number="10" title="STAN MENTALNY PO SESJI" />`
Saves: `{ mentalAfter, whatShapedIt }`
prevHref: `/cards/${date}/evening/10`, nextHref: `/cards/${date}/evening/12`

- [ ] **Step 5: Create Step12Practice.tsx**

Single `<TextArea>` (5 rows): `deliberatePractice`.
Section header: `<SectionHeader number="11" title="DELIBERATE PRACTICE (poza tradingiem)" />`
Saves: `{ deliberatePractice }`
prevHref: `/cards/${date}/evening/11`, nextHref: `/cards/${date}/evening/13`

- [ ] **Step 6: Commit**

```powershell
git add components/wizard/steps/evening/Step8AreaScores.tsx \
        components/wizard/steps/evening/Step9Strengths.tsx \
        components/wizard/steps/evening/Step10Implementation.tsx \
        components/wizard/steps/evening/Step11MentalState.tsx \
        components/wizard/steps/evening/Step12Practice.tsx
git commit -m "feat: evening steps 8-12 — area scores, strengths, intention, mental, practice"
```

---

## Task 20: Evening Steps 13–15 — Evaluation, Identity, Tomorrow + complete

**Files:**
- Create: `components/wizard/steps/evening/Step13Evaluation.tsx`
- Create: `components/wizard/steps/evening/Step14Identity.tsx`
- Create: `components/wizard/steps/evening/Step15Tomorrow.tsx`

- [ ] **Step 1: Create Step13Evaluation.tsx**

```tsx
// components/wizard/steps/evening/Step13Evaluation.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, GoldCircles, TextInput } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import type { DailyCard } from "@prisma/client"

interface Props { card: DailyCard & { trades: any[]; emotionEntries: any[] }; date: string; step: number }

export function Step13Evaluation({ card, date, step }: Props) {
  const router = useRouter()
  const [processScore, setProcessScore] = useState<number | null>(card.processScore)
  const [pl, setPl] = useState(card.pl ?? "")
  const [overallScore, setOverallScore] = useState<number | null>(card.overallScore)
  const [saving, setSaving] = useState(false)

  async function handleNext() {
    setSaving(true)
    await updateDailyCard(card.id, {
      processScore: processScore ?? undefined,
      pl,
      overallScore: overallScore ?? undefined,
    })
    router.push(`/cards/${date}/evening/14`)
  }

  return (
    <WizardLayout
      date={date} session="evening" currentStep={step} totalSteps={15}
      stepLabel="Ocena dzienna"
      prevHref={`/cards/${date}/evening/12`}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="12" title="OCENA DZIENNA" />

        <div className="flex flex-col gap-2 py-2">
          {/* Process score 1-10 */}
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--color-muted)", fontSize: "var(--font-size-label)", minWidth: 140 }}>
              Process score (1–10):
            </span>
            <div className="flex gap-1">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setProcessScore(n)}
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: 20, height: 20,
                    border: `0.8px solid var(--color-accent)`,
                    background: processScore === n ? "var(--color-accent)" : "var(--color-white)",
                    color: processScore === n ? "var(--color-white)" : "var(--color-muted)",
                    fontSize: 8,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <TextInput label="P&L:" value={pl} onChange={setPl} placeholder="np. +1.5R lub -2%" />
          <GoldCircles label="Ogólna ocena:" value={overallScore} onChange={setOverallScore} />
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white" style={{ borderColor: "var(--color-border)" }}>
        <div className="mx-auto px-4 py-3 flex justify-between" style={{ maxWidth: "var(--content-max-width)" }}>
          <a href={`/cards/${date}/evening/12`} style={{ color: "var(--color-muted)", fontSize: 14 }}>← Wstecz</a>
          <button onClick={handleNext} disabled={saving} className="px-4 py-2 rounded text-sm font-medium" style={{ background: "var(--color-mid)", color: "var(--color-white)" }}>
            {saving ? "Zapisuję..." : "Dalej →"}
          </button>
        </div>
      </div>
    </WizardLayout>
  )
}
```

- [ ] **Step 2: Create Step14Identity.tsx**

Two `<TextArea>` components (5 rows each):
- `proudOf`: label `"Z czego byłby DUMNY trader, którym chcę być?"`
- `ashamedOf`: label `"Za co byłby ZAWSTYDZONY trader, którym chcę być?"`

**Important:** Do NOT soften or remove either question. Both are load-bearing (see `docs/philosophy.md`).
Section header: `<SectionHeader number="13" title="TOŻSAMOŚĆ" />`
Saves: `{ proudOf, ashamedOf }`
prevHref: `/cards/${date}/evening/13`, nextHref: `/cards/${date}/evening/15`

- [ ] **Step 3: Create Step15Tomorrow.tsx — final step, sets status COMPLETED**

```tsx
// components/wizard/steps/evening/Step15Tomorrow.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, TextArea } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import type { DailyCard } from "@prisma/client"

interface Props { card: DailyCard & { trades: any[]; emotionEntries: any[] }; date: string; step: number }

export function Step15Tomorrow({ card, date, step }: Props) {
  const router = useRouter()
  const [tomorrowRemember, setTomorrowRemember] = useState(card.tomorrowRemember ?? "")
  const [saving, setSaving] = useState(false)

  async function handleFinish() {
    setSaving(true)
    await updateDailyCard(card.id, {
      tomorrowRemember,
      status: "COMPLETED",
    })
    router.push(`/cards/${date}/complete`)
  }

  return (
    <WizardLayout
      date={date} session="evening" currentStep={step} totalSteps={15}
      stepLabel="Lekcja na jutro"
      prevHref={`/cards/${date}/evening/14`}
    >
      <div className="flex flex-col gap-4">
        <SectionHeader number="14" title="LEKCJA NA JUTRO" />
        <TextArea
          label="Jutro pamiętaj o:"
          value={tomorrowRemember}
          onChange={setTomorrowRemember}
          rows={6}
          placeholder="To pole pojawi się jutro na górze Twojej karty dziennej."
        />
        <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", fontStyle: "italic" }}>
          Ta lekcja pojawi się automatycznie na górze jutrzejszej karty dziennej.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-white" style={{ borderColor: "var(--color-border)" }}>
        <div className="mx-auto px-4 py-3 flex justify-between" style={{ maxWidth: "var(--content-max-width)" }}>
          <a href={`/cards/${date}/evening/14`} style={{ color: "var(--color-muted)", fontSize: 14 }}>← Wstecz</a>
          <button
            onClick={handleFinish}
            disabled={saving}
            className="px-6 py-2 rounded font-medium"
            style={{ background: "var(--color-gold)", color: "var(--color-white)", fontSize: 14 }}
          >
            {saving ? "Zapisuję..." : "Zakończ dzień"}
          </button>
        </div>
      </div>
    </WizardLayout>
  )
}
```

- [ ] **Step 4: Commit**

```powershell
git add components/wizard/steps/evening/Step13Evaluation.tsx \
        components/wizard/steps/evening/Step14Identity.tsx \
        components/wizard/steps/evening/Step15Tomorrow.tsx
git commit -m "feat: evening steps 13-15 — evaluation, identity, tomorrow (Bridge 1 source)"
```

---

**Part 2 complete.** The full wizard is implemented. Continue with `2026-05-05-phase1-part3-completion.md` for PDF export, dashboard, auth pages, and deployment.
