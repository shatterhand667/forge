# Spec: Playbook Triggers + Statistics Drill-down

**Date:** 2026-06-04
**Status:** Approved

---

## Problem

The `trigger` column in the Daily Card Trade Log is a free-text textarea. This makes statistics unreliable (typos, inconsistent naming) and prevents drill-down analysis. The Setup column already uses a structured dropdown backed by `PlaybookSetup` — Trigger should work the same way.

Additionally, the Statistics page shows per-setup metrics but has no way to drill deeper into what triggered entries within a given setup.

---

## Solution Overview

Two independent stages:

1. **Playbook Triggers tab + Log overlay-select** — replace free-text trigger with a FK-backed dropdown, same pattern as Setup.
2. **Statistics setup drill-down** — clicking a setup row opens a subpage showing per-trigger stats for that setup.

---

## Stage 1: Playbook Triggers + Trade Log

### Database

**New model `PlaybookTrigger`:**
```prisma
model PlaybookTrigger {
  id          String   @id @default(cuid())
  playbookId  String
  playbook    Playbook @relation(fields: [playbookId], references: [id], onDelete: Cascade)
  name        String   @default("")
  description String?
  order       Int      @default(0)
  trades      Trade[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Changes to existing models:**
- `Playbook`: add `triggers PlaybookTrigger[]`
- `Trade`: add `playbookTriggerId String?` with FK to `PlaybookTrigger` (onDelete: SetNull)

The existing `trigger String?` field on `Trade` is NOT removed — kept for backward compatibility with any existing data.

### Server Actions (`actions/playbook.ts`)

Four new functions mirroring the setup actions:
- `createTrigger()` — upserts playbook if needed, creates `PlaybookTrigger` with next order
- `updateTrigger(id, data: { name?, description? })` — partial update
- `deleteTrigger(id)` — delete by id
- `getPlaybookTriggers()` — returns `{ id, name }[]` ordered by `order asc`

### PlaybookView — Triggers Section

New collapsible section **"Triggery (N)"** added above the Setupy section.

`TriggerCard` component (simpler than `SetupCard`):
- Inline editable name (same header input pattern as SetupCard)
- Expand/collapse toggle
- Optional `description` field (AutoTextarea, single field when expanded)
- Delete button with confirmation

Section has same "+ Dodaj trigger" dashed button pattern as "+ Dodaj setup".

The `PlaybookView` receives `triggers: Trigger[]` in its props (alongside existing `playbook`).

### Step6TradeLog — Trigger Column

The `trigger` column definition changes from:
```ts
{ id: "trigger", label: "Trigger", width: "10%", type: "textarea" }
```
to the overlay-select pattern (same implementation as `playbookSetupId`):
```ts
{ id: "playbookTriggerId", label: "Trigger", width: "10%" }
```

New prop: `playbookTriggers: { id: string; name: string }[]`

Render: invisible `<select>` over a `<div>` showing the trigger name, identical to the Setup column implementation.

The page/server that renders `Step6TradeLog` passes both `playbookSetups` and `playbookTriggers` via `getPlaybookTriggers()`.

---

## Stage 2: Statistics Drill-down

### Statistics Library (`lib/statistics.ts`)

New type and function:

```ts
type TriggerStats = {
  triggerId: string | null
  triggerName: string
  // same fields as SetupStats: trades, winRate, avgR, totalPnL, profitFactor, long, short, tierA, tierB, tierC
}

function computeTriggerStats(trades: TradeForStats[]): TriggerStats[]
```

`TradeForStats` extended with:
```ts
playbookTriggerId: string | null
playbookTrigger: { name: string } | null
```

`computeTriggerStats` mirrors `computeSetupStats` but groups by `playbookTriggerId`.

### New Page `/statistics/setup/[setupId]`

Route: `app/(app)/statistics/setup/[setupId]/page.tsx`

**Content:**
1. Header — setup name + "← Statystyki" back link (no `target`, same tab navigation)
2. `StatisticsFilter` (reused, same date range params)
3. 5 global stat cards (same as main statistics page, scoped to this setup's trades)
4. Per-trigger table — identical columns to the per-setup table: Trigger | Trades | Win Rate | Avg R | P&L | P.Factor | Long | Short | Tier A | B | C
5. "Bez triggera" row for trades with `playbookTriggerId = null`

**Data query:**
```ts
prisma.trade.findMany({
  where: {
    playbookSetupId: setupId,
    dailyCard: { userId, ...(dateFilter) },
  },
  include: {
    playbookTrigger: { select: { name: true } },
  },
})
```

If `setupId` not found or has no trades, show "Brak transakcji" message.

### Statistics Main Page — Clickable Setup Rows

Setup rows where `s.setupId !== null` become `<a>` links:
- `href="/statistics/setup/{s.setupId}?{current query params}"`
- `target="_blank"`
- Cursor pointer
- Subtle hover: background shifts to `var(--color-light)`
- "Bez setupu" row remains non-clickable

---

## Task Breakdown

| # | Task | Files |
|---|------|-------|
| 1 | Prisma migration: `PlaybookTrigger` model + `playbookTriggerId` on `Trade` | `prisma/schema.prisma`, new migration |
| 2 | Server actions for triggers | `actions/playbook.ts` |
| 3 | `TriggerCard` + Triggery section in `PlaybookView` | `components/dashboard/PlaybookView.tsx` |
| 4 | Change Trigger column in `Step6TradeLog` to overlay-select | `components/wizard/steps/evening/Step6TradeLog.tsx` |
| 5 | Pass `playbookTriggers` from dashboard/card page to `Step6TradeLog` | `app/(app)/cards/[date]/evening/[step]/page.tsx` |
| 6 | `computeTriggerStats` in statistics lib | `lib/statistics.ts` |
| 7 | New page `/statistics/setup/[setupId]` | `app/(app)/statistics/setup/[setupId]/page.tsx` |
| 8 | Clickable setup rows on `/statistics` | `app/(app)/statistics/page.tsx` |
