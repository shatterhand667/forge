# Weekly Review — Plan 1: Schema & Data Layer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add all WeeklyReview schema fields, Bridge 4 function, computeWeeklyStats (Bridge 3), and server actions — everything the UI plans will depend on.

**Architecture:** WeeklyStatus enum + ~30 new fields on WeeklyReview; pure `computeWeeklyStats` in `lib/weekly-stats.ts` (testable without auth); thin server actions in `actions/weekly.ts` (auth wrapper + revalidatePath); `getLastWeeklyReview` added to existing `lib/bridges.ts`.

**Tech Stack:** Next.js 15 App Router, Prisma v7, PostgreSQL, Vitest

---

## Files

| Action | Path |
|--------|------|
| Modify | `prisma/schema.prisma` |
| Modify | `lib/bridges.ts` |
| Modify | `__tests__/lib/bridges.test.ts` |
| Create | `lib/weekly-stats.ts` |
| Create | `__tests__/lib/weekly-stats.test.ts` |
| Create | `actions/weekly.ts` |

---

### Task 1: WeeklyStatus enum + WeeklyReview new fields + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add WeeklyStatus enum after CardStatus enum**

In `prisma/schema.prisma`, after the `CardStatus` enum block (after line 85), add:

```prisma
enum WeeklyStatus {
  IN_PROGRESS
  COMPLETED
}
```

- [ ] **Step 2: Add new fields to WeeklyReview model**

Replace the entire `WeeklyReview` model (currently lines 116–129) with:

```prisma
model WeeklyReview {
  id                   String        @id @default(cuid())
  userId               String
  user                 User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  weekStart            DateTime      @db.Date
  weekEnd              DateTime      @db.Date
  status               WeeklyStatus  @default(IN_PROGRESS)

  // Bridge 4: auto-populated from previous weekly's processGoalNextWeek
  lastWeekGoalRecap    String?

  // Section 1 — manual overrides
  maxDrawdown          String?
  netPL                String?

  // Section 2 — tier conclusions
  tierAConclusion      String?
  tierBConclusion      String?
  tierCConclusion      String?

  // Section 3 — day observations
  monObservation       String?
  tueObservation       String?
  wedObservation       String?
  thuObservation       String?
  friObservation       String?

  // Sections 5–9, 12–13 — narrative fields
  bestTradeWhy                String?
  worstTradeWhatWentWrong     String?
  lesson1                     String?
  lesson2                     String?
  lesson3                     String?
  gratitude                   String?
  patternWhenStrongest        String?
  identityWasThatTrader       String?
  identityWasNot              String?
  threatsMap                  String?

  // Section 10 — repeating errors table
  repeatingErrors      Json?

  // Section 11 — mental capital
  renewedMe            String?
  drainedMe            String?

  // Section 14 — Bridge 2 output
  bridgeStrategicTopic  String?
  bridgePreMortemItems  Json?

  // Section 15 — deliberate practice
  lastWeekPracticeCount         Int?
  lastWeekPracticeWhatWentWrong String?
  practicePlan                  Json?
  practiceMeta                  String?

  // Section 16 — goal + mentor
  oneSentenceSummary     String?
  mentorTopic            String?
  stopLossThreshold      String?
  systemCheck            String?
  processGoalProbability Int?
  processGoalNextWeek    String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, weekStart])
}
```

- [ ] **Step 3: Run migration**

```powershell
npx prisma migrate dev --name weekly_review_v2
```

Expected output contains:
```
Applying migration `..._weekly_review_v2`
Your database is now in sync with your schema.
```

- [ ] **Step 4: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```powershell
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add WeeklyStatus enum and all WeeklyReview fields"
```

---

### Task 2: getLastWeeklyReview bridge function

**Files:**
- Modify: `lib/bridges.ts`
- Modify: `__tests__/lib/bridges.test.ts`

- [ ] **Step 1: Add failing tests for getLastWeeklyReview**

In `__tests__/lib/bridges.test.ts`, add these imports at the top of the file (after the existing imports line):

```ts
import { getYesterdayLesson, getLastWeekLesson, getBridge2Items, getYesterdayMentorComment, getLastWeeklyReview } from "@/lib/bridges"
```

Then append to the end of `__tests__/lib/bridges.test.ts`:

```ts
describe("getLastWeeklyReview", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns processGoalNextWeek from most recent weekly before date", async () => {
    vi.mocked(prisma.weeklyReview.findFirst).mockResolvedValue({
      processGoalNextWeek: "Focusuj na A-setupach, max 3 trades/dzień",
    } as any)

    const result = await getLastWeeklyReview("u1", new Date("2026-05-11"))
    expect(result?.processGoalNextWeek).toBe("Focusuj na A-setupach, max 3 trades/dzień")
  })

  it("returns null when no previous weekly exists", async () => {
    vi.mocked(prisma.weeklyReview.findFirst).mockResolvedValue(null)

    const result = await getLastWeeklyReview("u1", new Date("2026-05-11"))
    expect(result).toBeNull()
  })

  it("queries with weekStart < beforeDate ordered descending", async () => {
    vi.mocked(prisma.weeklyReview.findFirst).mockResolvedValue(null)

    await getLastWeeklyReview("u1", new Date("2026-05-11"))

    expect(prisma.weeklyReview.findFirst).toHaveBeenCalledWith({
      where: { userId: "u1", weekStart: { lt: new Date("2026-05-11") } },
      orderBy: { weekStart: "desc" },
      select: { processGoalNextWeek: true },
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```powershell
npx vitest run __tests__/lib/bridges.test.ts
```

Expected: FAIL — `getLastWeeklyReview is not a function` or similar import error.

- [ ] **Step 3: Add getLastWeeklyReview to lib/bridges.ts**

Append to `lib/bridges.ts`:

```ts
export async function getLastWeeklyReview(
  userId: string,
  beforeDate: Date
): Promise<{ processGoalNextWeek: string | null } | null> {
  return prisma.weeklyReview.findFirst({
    where: { userId, weekStart: { lt: beforeDate } },
    orderBy: { weekStart: "desc" },
    select: { processGoalNextWeek: true },
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```powershell
npx vitest run __tests__/lib/bridges.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Run all tests**

```powershell
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```powershell
git add lib/bridges.ts __tests__/lib/bridges.test.ts
git commit -m "feat: add getLastWeeklyReview bridge function"
```

---

### Task 3: WeeklyStats type + computeWeeklyStats (Bridge 3)

**Files:**
- Create: `lib/weekly-stats.ts`
- Create: `__tests__/lib/weekly-stats.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/weekly-stats.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  prisma: {
    dailyCard: { findMany: vi.fn() },
  },
}))

import { prisma } from "@/lib/db"
import { computeWeeklyStats } from "@/lib/weekly-stats"

const weekStart = new Date("2026-05-04") // Monday
const weekEnd = new Date("2026-05-08")   // Friday

describe("computeWeeklyStats", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns zeros for an empty week", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.trades).toBe(0)
    expect(stats.winRate).toBe(0)
    expect(stats.avgR).toBe(0)
    expect(stats.profitFactor).toBe(0)
    expect(stats.bestR).toBe(0)
    expect(stats.worstR).toBe(0)
    expect(stats.sleepAvg).toBe(0)
    expect(stats.mentalPerDay).toEqual([null, null, null, null, null])
  })

  it("calculates winRate and avgR from trades with rActual", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([
      {
        date: new Date("2026-05-04"), sleep: null, processScore: null, pl: null, mentalAfter: null,
        trades: [
          { rActual: 1.5, tier: "A" },
          { rActual: -0.5, tier: "A" },
          { rActual: 2.0, tier: "B" },
        ],
      } as any,
    ])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.trades).toBe(3)
    expect(stats.winRate).toBeCloseTo(2 / 3)
    expect(stats.avgR).toBeCloseTo(1.0)
    expect(stats.bestR).toBe(2.0)
    expect(stats.worstR).toBe(-0.5)
  })

  it("calculates profitFactor as grossWin / grossLoss", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([
      {
        date: new Date("2026-05-04"), sleep: null, processScore: null, pl: null, mentalAfter: null,
        trades: [
          { rActual: 2.0, tier: "A" },
          { rActual: -1.0, tier: "A" },
        ],
      } as any,
    ])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.profitFactor).toBe(2.0)
  })

  it("returns profitFactor 0 when no losing trades", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([
      {
        date: new Date("2026-05-04"), sleep: null, processScore: null, pl: null, mentalAfter: null,
        trades: [{ rActual: 1.0, tier: "A" }],
      } as any,
    ])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.profitFactor).toBe(0)
  })

  it("groups trades by tier correctly", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([
      {
        date: new Date("2026-05-04"), sleep: null, processScore: null, pl: null, mentalAfter: null,
        trades: [
          { rActual: 1.0, tier: "A" },
          { rActual: 1.0, tier: "A" },
          { rActual: -1.0, tier: "B" },
        ],
      } as any,
    ])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.byTier.A.trades).toBe(2)
    expect(stats.byTier.A.winRate).toBe(1.0)
    expect(stats.byTier.A.netR).toBe(2.0)
    expect(stats.byTier.B.trades).toBe(1)
    expect(stats.byTier.B.winRate).toBe(0)
    expect(stats.byTier.C.trades).toBe(0)
    expect(stats.byTier.C.winRate).toBe(0)
  })

  it("maps cards to correct weekday slots in byDay", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([
      { date: new Date("2026-05-04"), sleep: 7, processScore: 8, pl: "+1.5R", mentalAfter: 6, trades: [] } as any, // Monday
      { date: new Date("2026-05-06"), sleep: 6, processScore: 7, pl: "-0.5R", mentalAfter: 5, trades: [] } as any, // Wednesday
    ])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.byDay.mon).toEqual({ processScore: 8, pl: "+1.5R", mentalAfter: 6 })
    expect(stats.byDay.wed).toEqual({ processScore: 7, pl: "-0.5R", mentalAfter: 5 })
    expect(stats.byDay.tue).toEqual({ processScore: null, pl: null, mentalAfter: null })
    expect(stats.byDay.thu).toEqual({ processScore: null, pl: null, mentalAfter: null })
    expect(stats.byDay.fri).toEqual({ processScore: null, pl: null, mentalAfter: null })
  })

  it("calculates sleepAvg ignoring null days", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([
      { date: new Date("2026-05-04"), sleep: 7, processScore: null, pl: null, mentalAfter: null, trades: [] } as any,
      { date: new Date("2026-05-05"), sleep: 8, processScore: null, pl: null, mentalAfter: null, trades: [] } as any,
      { date: new Date("2026-05-06"), sleep: null, processScore: null, pl: null, mentalAfter: null, trades: [] } as any,
    ])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.sleepAvg).toBe(7.5)
  })

  it("populates mentalPerDay as [mon, tue, wed, thu, fri]", async () => {
    vi.mocked(prisma.dailyCard.findMany).mockResolvedValue([
      { date: new Date("2026-05-04"), sleep: null, processScore: null, pl: null, mentalAfter: 7, trades: [] } as any,
      { date: new Date("2026-05-05"), sleep: null, processScore: null, pl: null, mentalAfter: 5, trades: [] } as any,
    ])

    const stats = await computeWeeklyStats("u1", weekStart, weekEnd)

    expect(stats.mentalPerDay).toEqual([7, 5, null, null, null])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```powershell
npx vitest run __tests__/lib/weekly-stats.test.ts
```

Expected: FAIL — `computeWeeklyStats` not found.

- [ ] **Step 3: Create lib/weekly-stats.ts**

Create `lib/weekly-stats.ts`:

```ts
import { prisma } from "@/lib/db"

export interface WeeklyStats {
  trades: number
  winRate: number
  avgR: number
  profitFactor: number
  bestR: number
  worstR: number
  sleepAvg: number
  byTier: {
    A: TierStats
    B: TierStats
    C: TierStats
  }
  byDay: {
    mon: DayStats
    tue: DayStats
    wed: DayStats
    thu: DayStats
    fri: DayStats
  }
  mentalPerDay: Array<number | null>
}

interface TierStats {
  trades: number
  winRate: number
  avgR: number
  netR: number
}

interface DayStats {
  processScore: number | null
  pl: string | null
  mentalAfter: number | null
}

function calcTierStats(trades: { rActual: number | null }[]): TierStats {
  const withR = trades.filter((t) => t.rActual !== null) as { rActual: number }[]
  if (withR.length === 0) return { trades: trades.length, winRate: 0, avgR: 0, netR: 0 }
  const wins = withR.filter((t) => t.rActual > 0)
  const netR = withR.reduce((sum, t) => sum + t.rActual, 0)
  return {
    trades: trades.length,
    winRate: wins.length / withR.length,
    avgR: netR / withR.length,
    netR,
  }
}

const DAY_INDEX_TO_KEY: Record<number, keyof WeeklyStats["byDay"]> = {
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
}

function emptyDayStats(): DayStats {
  return { processScore: null, pl: null, mentalAfter: null }
}

export async function computeWeeklyStats(
  userId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<WeeklyStats> {
  const cards = await prisma.dailyCard.findMany({
    where: { userId, date: { gte: weekStart, lte: weekEnd } },
    include: { trades: true },
    orderBy: { date: "asc" },
  })

  const allTrades = cards.flatMap((c) => c.trades)
  const withR = allTrades.filter((t) => t.rActual !== null) as (typeof allTrades)[number][]

  const wins = withR.filter((t) => t.rActual! > 0)
  const losses = withR.filter((t) => t.rActual! < 0)
  const totalR = withR.reduce((sum, t) => sum + t.rActual!, 0)
  const grossWin = wins.reduce((sum, t) => sum + t.rActual!, 0)
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.rActual!, 0))

  const sleepValues = cards.filter((c) => c.sleep !== null).map((c) => c.sleep as number)
  const sleepAvg =
    sleepValues.length > 0 ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length : 0

  const tierGroups: Record<"A" | "B" | "C", typeof allTrades> = { A: [], B: [], C: [] }
  for (const trade of allTrades) {
    const tier = trade.tier as "A" | "B" | "C" | null
    if (tier && tier in tierGroups) tierGroups[tier].push(trade)
  }

  const byDay: WeeklyStats["byDay"] = {
    mon: emptyDayStats(),
    tue: emptyDayStats(),
    wed: emptyDayStats(),
    thu: emptyDayStats(),
    fri: emptyDayStats(),
  }
  for (const card of cards) {
    const dow = new Date(card.date).getDay()
    const key = DAY_INDEX_TO_KEY[dow]
    if (key) {
      byDay[key] = {
        processScore: card.processScore,
        pl: card.pl,
        mentalAfter: card.mentalAfter,
      }
    }
  }

  return {
    trades: allTrades.length,
    winRate: withR.length > 0 ? wins.length / withR.length : 0,
    avgR: withR.length > 0 ? totalR / withR.length : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : 0,
    bestR: withR.length > 0 ? Math.max(...withR.map((t) => t.rActual!)) : 0,
    worstR: withR.length > 0 ? Math.min(...withR.map((t) => t.rActual!)) : 0,
    sleepAvg,
    byTier: {
      A: calcTierStats(tierGroups.A),
      B: calcTierStats(tierGroups.B),
      C: calcTierStats(tierGroups.C),
    },
    byDay,
    mentalPerDay: (["mon", "tue", "wed", "thu", "fri"] as const).map(
      (k) => byDay[k].mentalAfter
    ),
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```powershell
npx vitest run __tests__/lib/weekly-stats.test.ts
```

Expected: all 8 tests PASS.

- [ ] **Step 5: Run all tests**

```powershell
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```powershell
git add lib/weekly-stats.ts __tests__/lib/weekly-stats.test.ts
git commit -m "feat: add computeWeeklyStats (Bridge 3) with type definitions"
```

---

### Task 4: Server actions — getOrCreateWeeklyReview, updateWeeklyReview, getWeeklyStats

**Files:**
- Create: `actions/weekly.ts`

No unit test here — auth layer makes direct testing awkward, and all logic is already tested in lib functions. Verify with TypeScript compile + integration.

- [ ] **Step 1: Create actions/weekly.ts**

Create `actions/weekly.ts`:

```ts
"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getLastWeeklyReview } from "@/lib/bridges"
import { computeWeeklyStats } from "@/lib/weekly-stats"
import { revalidatePath } from "next/cache"
import type { WeeklyStatus } from "@prisma/client"

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function getOrCreateWeeklyReview(weekStartStr: string) {
  const userId = await requireUser()
  const weekStart = new Date(weekStartStr)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 4) // Mon → Fri

  const lastWeekly = await getLastWeeklyReview(userId, weekStart)
  const lastWeekGoalRecap = lastWeekly?.processGoalNextWeek ?? null

  return prisma.weeklyReview.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    create: { userId, weekStart, weekEnd, lastWeekGoalRecap },
    update: { lastWeekGoalRecap },
  })
}

export async function updateWeeklyReview(
  id: string,
  data: Partial<{
    status: WeeklyStatus
    maxDrawdown: string
    netPL: string
    tierAConclusion: string
    tierBConclusion: string
    tierCConclusion: string
    monObservation: string
    tueObservation: string
    wedObservation: string
    thuObservation: string
    friObservation: string
    bestTradeWhy: string
    worstTradeWhatWentWrong: string
    lesson1: string
    lesson2: string
    lesson3: string
    gratitude: string
    patternWhenStrongest: string
    identityWasThatTrader: string
    identityWasNot: string
    threatsMap: string
    repeatingErrors: unknown
    renewedMe: string
    drainedMe: string
    bridgeStrategicTopic: string
    bridgePreMortemItems: unknown
    lastWeekPracticeCount: number
    lastWeekPracticeWhatWentWrong: string
    practicePlan: unknown
    practiceMeta: string
    oneSentenceSummary: string
    mentorTopic: string
    stopLossThreshold: string
    systemCheck: string
    processGoalProbability: number
    processGoalNextWeek: string
  }>
) {
  const userId = await requireUser()
  const review = await prisma.weeklyReview.findFirst({ where: { id, userId } })
  if (!review) throw new Error("WeeklyReview not found")
  await prisma.weeklyReview.update({ where: { id }, data })
  revalidatePath("/dashboard")
}

export async function getWeeklyReview(weekStartStr: string) {
  const userId = await requireUser()
  const weekStart = new Date(weekStartStr)
  return prisma.weeklyReview.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  })
}

export async function getWeeklyStats(weekStartStr: string) {
  const userId = await requireUser()
  const weekStart = new Date(weekStartStr)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 4)
  return computeWeeklyStats(userId, weekStart, weekEnd)
}

export async function getWeeklyReviewsByMonth(year: number, month: number) {
  const userId = await requireUser()
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return prisma.weeklyReview.findMany({
    where: { userId, weekStart: { gte: start, lte: end } },
    select: { weekStart: true, status: true },
    orderBy: { weekStart: "asc" },
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```powershell
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```powershell
git add actions/weekly.ts
git commit -m "feat: add weekly review server actions (getOrCreate, update, stats)"
```

---

## Self-Review

**Spec coverage check:**
- ✅ WeeklyStatus enum (`IN_PROGRESS` / `COMPLETED`)
- ✅ All ~30 new fields on WeeklyReview from spec
- ✅ `getLastWeeklyReview` for Bridge 4
- ✅ `computeWeeklyStats` with full WeeklyStats interface (Bridge 3)
- ✅ `getOrCreateWeeklyReview` — creates with Bridge 4, refreshes on re-open
- ✅ `updateWeeklyReview` — all fields in Partial
- ✅ `getWeeklyStats` action (calls lib function, adds auth)
- ✅ `getWeeklyReviewsByMonth` — needed by dashboard + calendar in later plans
- ✅ Bridge 2 (`getLastWeekLesson` / `getBridge2Items`) already correct in bridges.ts — no change needed

**Not in scope for this plan (covered in later plans):**
- WeeklyWizardLayout component
- Step01–Step16 components
- Dashboard WeeklyAction / WeeklyHistoryList
- Calendar Saturday/Sunday links
- Complete page
