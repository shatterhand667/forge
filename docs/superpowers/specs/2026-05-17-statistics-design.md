# Statistics Page — Design Spec
**Date:** 2026-05-17  
**Status:** Approved

---

## Overview

A dedicated analytics page (`/statistics`) giving the trader a breakdown of trade performance per setup, with date range filtering and a global summary. The page is read-only — no editing happens here.

---

## Navigation

- New button **"Statystyki"** added in the dashboard tab row, visually matching the Historia / Kalibracja / Playbook buttons.
- Clicking navigates to `/statistics` (same-tab navigation, separate page route).
- The "THE FORGE" logo on the statistics page links back to `/dashboard`.

---

## Date Range Filter

Two ways to filter — both produce URL params and trigger a full server render:

**Presets** (buttons): `2 tygodnie` | `4 tygodnie` | `3 miesiące` | `Wszystko`  
**Custom date picker**: "Od" / "Do" date inputs next to the presets.

- Default: `4 tygodnie` (`?range=4w`).
- Preset params: `?range=2w`, `?range=4w`, `?range=3m`, `?range=all`.
- Custom range params: `?from=YYYY-MM-DD&to=YYYY-MM-DD` (overrides preset when both present).
- Filter is a small client component; rest of the page is a Server Component.

---

## Global Summary Bar

Displayed below the filter, above the table. Covers **all trades** in the selected period regardless of setup.

| Trades | Win Rate | Avg R | Total P&L | Profit Factor |
|--------|----------|-------|-----------|---------------|

- **Win Rate**: trades where `rActual > 0` / trades where `rActual` is not null. Shows "—" if no trades have rActual.
- **Avg R**: mean of `rActual` (non-null only), rounded to 2 decimal places.
- **Total P&L**: sum of `profitRaw`, with `+/-` sign and green/red color.
- **Profit Factor**: sum of positive `profitRaw` / |sum of negative `profitRaw`|. Shows "∞" if no losses, "0.00" if no wins.

---

## Per-Setup Table

One row per setup, sorted descending by trade count. Columns:

| Setup | Trades | Win Rate | Avg R | P&L ($) | Profit Factor | Long | Short | Tier A | Tier B | Tier C |
|-------|--------|----------|-------|---------|---------------|------|-------|--------|--------|--------|

### Column definitions

- **Setup** — name from `PlaybookSetup`. "Bez setupu" for trades where `playbookSetupId` is null.
- **Trades** — total count of trades for this setup in the period.
- **Win Rate** — `rActual > 0` / non-null `rActual` trades. "—" if no rActual values.
- **Avg R** — mean of non-null `rActual`, 2 decimal places.
- **P&L ($)** — sum of `profitRaw`, colored green (> 0) or red (< 0), with sign.
- **Profit Factor** — gross profit / |gross loss| from `profitRaw`. "∞" if no losses. "0.00" if no wins.
- **Long / Short** — count of trades per direction (not percentage).
- **Tier A / B / C** — count of trades with that tier value. Trades without a tier are not counted in any tier column.

### "Bez setupu" row

- Appears at the **bottom of the table** only when at least one trade in the period has `playbookSetupId = null`.
- Uses identical columns.
- Updates automatically when setups are assigned to those trades in the daily card.

---

## Data Layer

- No new Prisma models or migrations required.
- Single query: `prisma.trade.findMany` with `include: { playbookSetup, dailyCard: { select: { date } } }`, filtered by `dailyCard.date` range and `dailyCard.userId`.
- Grouping and all metric computation done in TypeScript on the server (data volumes are small — a few hundred to low thousands of trades at most).

---

## Implementation Notes

- Page: `app/(app)/statistics/page.tsx` — async Server Component.
- Filter component: `components/statistics/StatisticsFilter.tsx` — `"use client"`, reads URL params, pushes new params on change.
- Computation helper: `lib/statistics.ts` — pure function `computeSetupStats(trades)` → typed result.
- Dashboard button: added to `app/(app)/dashboard/page.tsx` tab row alongside existing tabs.

---

## Out of Scope (this version)

- Clicking a setup row to drill down into individual trades.
- Per-day or per-week trend charts.
- Correlation of mental/sleep scores with performance.
- Export to CSV/PDF.
