# Weekly Review Implementation Design

## Goal

Build the Weekly Review (layer 2) as a 16-step wizard with auto-aggregation from daily cards, and wire Bridges 2, 3, and 4.

## Architecture

16-step wizard at `/weekly/[weekStart]/[step]`. Auto-calculations computed on-the-fly at open time from daily cards and trades — not stored in the database. Bridges 2, 3, 4 all active in this build.

## Tech Stack

Next.js 15 App Router, Prisma v7, PostgreSQL, TypeScript, server actions.

---

## Data Model

### WeeklyReview schema additions (Prisma)

Existing fields (keep): `id`, `userId`, `weekStart`, `weekEnd`, `bridgeStrategicTopic`, `bridgePreMortemItems` (Json), `processGoalNextWeek`, `createdAt`, `updatedAt`.

New fields to add:

```prisma
// title bar
lastWeekGoalRecap       String?   // Bridge 4: auto-populated from previous weekly's processGoalNextWeek
oneSentenceSummary      String?   // filled manually on step 16

// section 1 — manual overrides for non-calculable columns
maxDrawdown             String?   // manual (too complex to auto-calc)
netPL                   String?   // manual (currency not in DB)

// section 2 — tier conclusions
tierAConclusion         String?
tierBConclusion         String?
tierCConclusion         String?

// section 3 — day observations
monObservation          String?
tueObservation          String?
wedObservation          String?
thuObservation          String?
friObservation          String?

// sections 5–9, 12–13 — narrative fields
bestTradeWhy            String?
worstTradeWhatWentWrong String?
lesson1                 String?
lesson2                 String?
lesson3                 String?
gratitude               String?
patternWhenStrongest    String?
identityWasThatTrader   String?
identityWasNot          String?
threatsMap              String?

// section 10 — repeating errors table (dynamic rows)
repeatingErrors         Json?
// shape: Array<{ error: string, count: number, triggerContext: string, costR: number | null, eliminationPlan: string }>

// section 11 — mental capital
renewedMe               String?
drainedMe               String?

// section 15 — deliberate practice
lastWeekPracticeCount       Int?
lastWeekPracticeWhatWentWrong String?
practicePlan            Json?
// shape: Array<{ priority: "MUST" | "SHOULD", task: string, when: string, howMeasure: string }>
practiceMeta            String?

// section 16 — mentor / stop-loss / goal
mentorTopic             String?
stopLossThreshold       String?
systemCheck             String?
processGoalProbability  Int?      // 0–100
// processGoalNextWeek already exists
```

### WeeklyStats (computed, not stored)

Calculated at open time, passed as props to steps:

```ts
interface WeeklyStats {
  trades: number
  winRate: number        // 0–1
  avgR: number
  profitFactor: number
  bestR: number
  worstR: number
  sleepAvg: number
  byTier: {
    A: { trades: number; winRate: number; avgR: number; netR: number }
    B: { trades: number; winRate: number; avgR: number; netR: number }
    C: { trades: number; winRate: number; avgR: number; netR: number }
  }
  byDay: {
    mon: { processScore: number | null; pl: string | null; mentalAfter: number | null }
    tue: { processScore: number | null; pl: string | null; mentalAfter: number | null }
    wed: { processScore: number | null; pl: string | null; mentalAfter: number | null }
    thu: { processScore: number | null; pl: string | null; mentalAfter: number | null }
    fri: { processScore: number | null; pl: string | null; mentalAfter: number | null }
  }
  mentalPerDay: Array<number | null>  // [mon, tue, wed, thu, fri] for section 11 dots
}
```

---

## Routing & File Structure

```
app/(app)/weekly/[weekStart]/[step]/page.tsx     — server component
app/(app)/weekly/[weekStart]/complete/page.tsx   — completion screen

actions/weekly.ts
  getOrCreateWeeklyReview(userId, weekStart)     — creates or fetches, refreshes Bridge 4
  updateWeeklyReview(id, data)                   — partial update
  computeWeeklyStats(userId, weekStart, weekEnd) — Bridge 3 calculations

lib/bridges.ts  (additions)
  getLastWeeklyReview(userId, beforeDate)        — for Bridge 4 and Bridge 2

components/wizard/weekly/
  WeeklyWizardLayout.tsx                         — header with week #, date range, lastWeekGoalRecap
  steps/
    Step01Stats.tsx          — Section 1: stats table (auto) + maxDD/netPL manual
    Step02TierSizing.tsx     — Section 2: tier table (auto) + conclusion textareas
    Step03DaysHeatmap.tsx    — Section 3: days table (auto) + observation textareas
    Step04EdgeTrend.tsx      — Section 4: 4-week trend table (auto, read-only)
    Step05BestTrade.tsx      — Section 5: textarea
    Step06WorstTrade.tsx     — Section 6: textarea
    Step07Lessons.tsx        — Section 7: 3× TextInput
    Step08Gratitude.tsx      — Section 8: textarea
    Step09PatternAnalysis.tsx — Section 9: textarea
    Step10RepeatingErrors.tsx — Section 10: dynamic table (TableInput pattern)
    Step11MentalCapital.tsx  — Section 11: dots row (auto) + 2× textarea
    Step12IdentityCheck.tsx  — Section 12: 2× textarea
    Step13ThreatsMap.tsx     — Section 13: textarea
    Step14Bridge.tsx         — Section 14: textarea + 3× TextInput (Bridge 2)
    Step15Practice.tsx       — Section 15: number + text + fixed 3-row table (no add/remove) + text
    Step16Goal.tsx           — Section 16: oneSentenceSummary TextInput + 4× TextInput + probability slider
```

---

## Wizard Navigation

- `WeeklyWizardLayout` renders sticky header with: "TRADING POD · WEEKLY REVIEW", week number, date range (Mon–Fri), and `lastWeekGoalRecap` (read-only, from Bridge 4).
- `prevHref` / `nextHref` follow same pattern as `WizardLayout` in daily card.
- Step 16 "next" button → `/weekly/[weekStart]/complete`.
- Each step saves its fields on "Dalej →" click (same pattern as daily card steps).
- Auto-save on blur is not implemented — explicit save on step advance only.

---

## Bridge 3: Daily → Weekly (auto-aggregation)

`computeWeeklyStats(userId, weekStart, weekEnd)`:

1. Fetch all `DailyCard` for `userId` where `date BETWEEN weekStart AND weekEnd`, including `trades[]`.
2. Collect all trades from those cards.
3. Calculate:
   - `trades` = total trade count
   - `winRate` = trades where `rActual > 0` / total (exclude null rActual)
   - `avgR` = mean of `rActual` (exclude null)
   - `profitFactor` = sum(rActual where > 0) / abs(sum(rActual where < 0)); return 0 if no losing trades
   - `bestR` = max(rActual), `worstR` = min(rActual)
   - `sleepAvg` = mean of `DailyCard.sleep` (sleep field is in hours as integer)
   - `byTier` = group trades by `tier` field ("A"/"B"/"C"), calculate same stats per group
   - `byDay` = map each DailyCard by weekday → `processScore`, `pl`, `mentalAfter`
   - `mentalPerDay` = [mon.mentalAfter, tue.mentalAfter, ...] (null if no card)
4. Return `WeeklyStats` object. Never stored in DB.

Steps 1–3 and 11 receive `weeklyStats` as a prop from the page server component.

---

## Bridge 4: Weekly → Weekly

In `getOrCreateWeeklyReview(userId, weekStart)`:

1. Find the most recent `WeeklyReview` where `weekStart < current weekStart`, ordered by `weekStart DESC`.
2. On create: set `lastWeekGoalRecap = previousWeekly.processGoalNextWeek ?? null`.
3. On subsequent opens (upsert exists): update `lastWeekGoalRecap` same as daily card refreshes `yesterdayLesson`.

`WeeklyWizardLayout` displays `lastWeekGoalRecap` in sticky header as a read-only strip (same visual pattern as lesson strip in WizardLayout).

---

## Bridge 2: Weekly → Daily (verification only)

Bridge 2 is already partially wired: `getOrCreateDailyCard` in `actions/cards.ts` calls `getLastWeekLesson` which reads from `WeeklyReview.bridgeStrategicTopic`. Once the user fills Step 14 (`bridgeStrategicTopic`), it propagates automatically to the next week's daily cards.

Verification task: confirm `getLastWeekLesson` in `lib/bridges.ts` queries `WeeklyReview` correctly (not `DailyCard.lastWeekLesson`).

---

## Dashboard Integration

### WeeklyAction component

`components/dashboard/WeeklyAction.tsx` — shown below `PrimaryAction` on Friday (weekday 5), Saturday (6), Sunday (0):

- No weekly review for current week → "Wypełnij przegląd tygodniowy →" (gold border, secondary style)
- Weekly in progress → "Wróć do przeglądu tygodniowego →"
- Weekly COMPLETED → "Przegląd tygodniowy: ukończony ✓" (muted, non-clickable)

`weekStart` = most recent Monday (calculated from today's local date).

`dashboard/page.tsx` fetches current week's WeeklyReview status and passes to `WeeklyAction`.

### WeeklyHistoryList component

`components/dashboard/WeeklyHistoryList.tsx` — collapsible section "Poprzednie tygodnie", **collapsed by default**. Shows last 4 weekly reviews: date range, status label, "Podgląd" link to step 1.

Existing `HistoryList` section "Poprzednie dni" also becomes collapsible, **collapsed by default**.

Both sections use a `<details>/<summary>` HTML element for collapse (no JS needed, no state).

---

## Calendar Integration

`CalendarView.tsx` changes:

- Saturday (day index 5) and Sunday (day index 6) cells link to `/weekly/[weekStart]/1` instead of daily card URL.
- `weekStart` = the Monday of that calendar week.
- Color:
  - No weekly → `var(--color-light)` (same as day without card)
  - Weekly exists (any status except COMPLETED) → `var(--color-gold)`
  - Weekly COMPLETED → `var(--color-mid)`
- `CalendarView` receives additional prop `weeklyCards: Array<{ weekStart: Date; status: "IN_PROGRESS" | "COMPLETED" }>`.
- Dashboard page fetches weekly reviews for the displayed month and passes to `CalendarView`.

### WeeklyReview status enum

Add `WeeklyStatus` enum to Prisma:

```prisma
enum WeeklyStatus {
  IN_PROGRESS
  COMPLETED
}

// WeeklyReview model:
status  WeeklyStatus  @default(IN_PROGRESS)
```

Status set to `COMPLETED` when user reaches `/weekly/[weekStart]/complete`.

---

## Complete page

`/weekly/[weekStart]/complete`:
- Shows summary: week range, oneSentenceSummary, 3 lessons.
- "Edytuj przegląd" → step 1.
- PDF export placeholder (button visible, disabled, tooltip "Wkrótce").
- Sets `status = COMPLETED` on arrival (server action called from page).

---

## Error Handling

- If `weekStart` param is not a valid Monday date → redirect to dashboard.
- If step param is out of 1–16 range → redirect to step 1.
- If user navigates to a weekly review that belongs to a different user → 404.

---

## What is NOT in scope

- PDF export for weekly (placeholder only)
- Bridge 5 (Weekly → Monthly) — no Monthly Review yet
- Bridge 9 (Calibration tracking dashboard) — deferred
- Bridge 10 (Stop-loss alert parsing) — stopLossThreshold stored as text, no alert logic yet
- Section 4 edge trend: only shows data if previous WeeklyReviews exist; shows "Brak danych" gracefully when no previous weeklies exist
