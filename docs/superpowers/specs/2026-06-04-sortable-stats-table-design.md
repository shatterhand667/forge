# Spec: Sortable Statistics Table

**Date:** 2026-06-04
**Status:** Approved

## Problem

The statistics table on `/statistics` and `/statistics/setup/[setupId]` sorts rows by trade count descending by default and offers no way to re-sort. Users can't quickly find e.g. the setup with the best Win Rate or highest P&L.

## Solution

Extract both tables into a shared `SortableStatsTable` client component with click-to-sort column headers.

## StatsRow Interface

```ts
type StatsRow = {
  id: string | null
  name: string
  trades: number
  winRate: number | null
  avgR: number | null
  totalPnL: number
  profitFactor: number | string  // "∞" | "—" | number
  long: number
  short: number
  tierA: number
  tierB: number
  tierC: number
}
```

## Component API

```ts
SortableStatsTable({
  rows: StatsRow[]
  firstColumnLabel: string
  renderFirstCell?: (row: StatsRow) => React.ReactNode
})
```

`renderFirstCell` — optional override for the first column cell. `/statistics` uses it to render setup-name links (`<a target="_blank">`). The trigger drill-down page omits it; component falls back to `row.name`.

## Sorting Behaviour

- Default: `{ key: "trades", dir: "desc" }` — same as current
- Click same header → toggle direction
- Click new header → set descending (except `name` column → ascending)
- `null` values sort last in both directions (`null` → `-Infinity` for desc, `+Infinity` for asc)
- `profitFactor`: `"∞"` → `Infinity`, `"—"` → `null` (sorts last)
- "Bez setupu" / "Bez triggera" rows sort with the rest (no pinning)

## Visual

- Active column header: label + `▼` (desc) or `▲` (asc), cursor pointer
- Inactive column headers: cursor pointer, no indicator
- All existing cell color logic preserved (green/red for metrics)

## Files

| File | Change |
|------|--------|
| `components/statistics/SortableStatsTable.tsx` | New client component |
| `app/(app)/statistics/page.tsx` | Replace table JSX with `<SortableStatsTable>` |
| `app/(app)/statistics/setup/[setupId]/page.tsx` | Replace table JSX with `<SortableStatsTable>` |
