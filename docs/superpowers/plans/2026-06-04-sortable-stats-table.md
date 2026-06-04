# Sortable Statistics Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add click-to-sort column headers to both statistics tables (`/statistics` and `/statistics/setup/[setupId]`) via a shared `SortableStatsTable` client component.

**Architecture:** New `SortableStatsTable` client component owns sort state and renders the full table. Both server-component pages map their data to the shared `StatsRow` type and pass it as props. A `firstCellLinkBase`/`firstCellLinkSuffix` prop pair (serializable strings) lets the main stats page link setup rows to the drill-down page without passing functions across the server/client boundary. Pure `sortRows` function is extracted and unit-tested.

**Tech Stack:** Next.js 14 App Router, React `useState`, TypeScript, Vitest

---

## File Map

| File | Change |
|------|--------|
| `components/statistics/SortableStatsTable.tsx` | New — client component + exported types + `sortRows` |
| `__tests__/lib/sortable-stats-table.test.ts` | New — Vitest tests for `sortRows` |
| `app/(app)/statistics/page.tsx` | Replace table JSX + remove unused style helpers |
| `app/(app)/statistics/setup/[setupId]/page.tsx` | Replace table JSX + remove unused style helpers |

---

## Task 1: SortableStatsTable component + sortRows tests

**Files:**
- Create: `components/statistics/SortableStatsTable.tsx`
- Create: `__tests__/lib/sortable-stats-table.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/sortable-stats-table.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { sortRows } from "@/components/statistics/SortableStatsTable"
import type { StatsRow } from "@/components/statistics/SortableStatsTable"

const r = (overrides: Partial<StatsRow> = {}): StatsRow => ({
  id: "1",
  name: "Breakout",
  trades: 10,
  winRate: 0.6,
  avgR: 1.2,
  totalPnL: 200,
  profitFactor: 2.5,
  long: 7,
  short: 3,
  tierA: 5,
  tierB: 3,
  tierC: 2,
  ...overrides,
})

describe("sortRows", () => {
  it("sorts by trades descending", () => {
    const rows = [r({ id: "a", trades: 5 }), r({ id: "b", trades: 10 }), r({ id: "c", trades: 1 })]
    const result = sortRows(rows, "trades", "desc")
    expect(result.map(r => r.trades)).toEqual([10, 5, 1])
  })

  it("sorts by trades ascending", () => {
    const rows = [r({ id: "a", trades: 5 }), r({ id: "b", trades: 10 }), r({ id: "c", trades: 1 })]
    const result = sortRows(rows, "trades", "asc")
    expect(result.map(r => r.trades)).toEqual([1, 5, 10])
  })

  it("sorts by name ascending", () => {
    const rows = [r({ id: "a", name: "Zebra" }), r({ id: "b", name: "Alpha" }), r({ id: "c", name: "Mid" })]
    const result = sortRows(rows, "name", "asc")
    expect(result.map(r => r.name)).toEqual(["Alpha", "Mid", "Zebra"])
  })

  it("sorts by name descending", () => {
    const rows = [r({ id: "a", name: "Zebra" }), r({ id: "b", name: "Alpha" }), r({ id: "c", name: "Mid" })]
    const result = sortRows(rows, "name", "desc")
    expect(result.map(r => r.name)).toEqual(["Zebra", "Mid", "Alpha"])
  })

  it("places null winRate last when sorting desc", () => {
    const rows = [r({ id: "a", winRate: null }), r({ id: "b", winRate: 0.8 }), r({ id: "c", winRate: 0.3 })]
    const result = sortRows(rows, "winRate", "desc")
    expect(result[2].winRate).toBeNull()
  })

  it("places null winRate last when sorting asc", () => {
    const rows = [r({ id: "a", winRate: null }), r({ id: "b", winRate: 0.8 }), r({ id: "c", winRate: 0.3 })]
    const result = sortRows(rows, "winRate", "asc")
    expect(result[2].winRate).toBeNull()
  })

  it("sorts profitFactor: Infinity ('∞') highest, null ('—') last", () => {
    const rows = [
      r({ id: "a", profitFactor: "—" }),
      r({ id: "b", profitFactor: 1.5 }),
      r({ id: "c", profitFactor: "∞" }),
    ]
    const result = sortRows(rows, "profitFactor", "desc")
    expect(result[0].profitFactor).toBe("∞")
    expect(result[1].profitFactor).toBe(1.5)
    expect(result[2].profitFactor).toBe("—")
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run __tests__/lib/sortable-stats-table.test.ts
```

Expected: FAIL — `sortRows` and `StatsRow` not found.

- [ ] **Step 3: Create the component**

Create `components/statistics/SortableStatsTable.tsx`:

```typescript
"use client"

import { useState } from "react"

export type StatsRow = {
  id: string | null
  name: string
  trades: number
  winRate: number | null
  avgR: number | null
  totalPnL: number
  profitFactor: number | string
  long: number
  short: number
  tierA: number
  tierB: number
  tierC: number
}

export type SortKey =
  | "name" | "trades" | "winRate" | "avgR" | "totalPnL"
  | "profitFactor" | "long" | "short" | "tierA" | "tierB" | "tierC"

type SortDir = "asc" | "desc"

function pfNumeric(pf: number | string): number | null {
  if (pf === "∞") return Infinity
  if (pf === "—") return null
  return pf as number
}

export function sortRows(rows: StatsRow[], key: SortKey, dir: SortDir): StatsRow[] {
  return [...rows].sort((a, b) => {
    if (key === "name") {
      const cmp = a.name.localeCompare(b.name, "pl")
      return dir === "asc" ? cmp : -cmp
    }
    const aVal = key === "profitFactor" ? pfNumeric(a.profitFactor) : (a[key] as number | null)
    const bVal = key === "profitFactor" ? pfNumeric(b.profitFactor) : (b[key] as number | null)
    if (aVal === null && bVal === null) return 0
    if (aVal === null) return 1
    if (bVal === null) return -1
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return dir === "desc" ? -cmp : cmp
  })
}

function pct(n: number | null): string {
  if (n === null) return "—"
  return (n * 100).toFixed(0) + "%"
}

function pf(v: number | string): string {
  if (typeof v === "string") return v
  return v.toFixed(2)
}

const thBase: React.CSSProperties = {
  color: "#fff",
  padding: "5px 8px",
  fontSize: "var(--font-size-tiny)",
  fontWeight: 600,
  textAlign: "center",
  whiteSpace: "nowrap",
  background: "var(--color-mid)",
  cursor: "pointer",
  userSelect: "none",
}

const tdBase: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: "var(--font-size-tiny)",
  textAlign: "center",
  borderBottom: "0.5px solid var(--color-border)",
  verticalAlign: "middle",
}

const A = "rgba(0,0,0,0.06)"
const B = "rgba(80,120,220,0.05)"

const BG = {
  name:      "transparent",
  trades:    A,
  metrics:   B,
  direction: A,
  tiers:     B,
} as const

type ColGroup = keyof typeof BG

interface ThProps {
  label: string
  colKey: SortKey
  activeKey: SortKey
  activeDir: SortDir
  onClick: (k: SortKey) => void
  width?: number
  align?: "left" | "center"
}

function Th({ label, colKey, activeKey, activeDir, onClick, width, align = "center" }: ThProps) {
  const active = colKey === activeKey
  return (
    <th
      onClick={() => onClick(colKey)}
      style={{ ...thBase, width, textAlign: align }}
    >
      {label}
      {active && (
        <span style={{ marginLeft: 3, fontSize: 9, opacity: 0.85 }}>
          {activeDir === "desc" ? "▼" : "▲"}
        </span>
      )}
    </th>
  )
}

interface Props {
  rows: StatsRow[]
  firstColumnLabel: string
  /** Base URL for first-column links, e.g. "/statistics/setup/". Appended with row.id. */
  firstCellLinkBase?: string
  /** Query string suffix appended after id, e.g. "?range=4w". Include the "?". */
  firstCellLinkSuffix?: string
}

export function SortableStatsTable({
  rows,
  firstColumnLabel,
  firstCellLinkBase,
  firstCellLinkSuffix = "",
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("trades")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortKey(key)
      setSortDir(key === "name" ? "asc" : "desc")
    }
  }

  const sorted = sortRows(rows, sortKey, sortDir)

  const th = (label: string, colKey: SortKey, width?: number, align?: "left" | "center") => (
    <Th
      key={colKey}
      label={label}
      colKey={colKey}
      activeKey={sortKey}
      activeDir={sortDir}
      onClick={handleSort}
      width={width}
      align={align}
    />
  )

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
        <thead>
          <tr>
            {th(firstColumnLabel, "name",        undefined, "left")}
            {th("Trades",         "trades",       60)}
            {th("Win Rate",       "winRate",      72)}
            {th("Avg R",          "avgR",         60)}
            {th("P&L ($)",        "totalPnL",     80)}
            {th("P. Factor",      "profitFactor", 76)}
            {th("Long",           "long",         48)}
            {th("Short",          "short",        48)}
            {th("Tier A",         "tierA",        48)}
            {th("Tier B",         "tierB",        48)}
            {th("Tier C",         "tierC",        48)}
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => {
            const nameCell =
              firstCellLinkBase && s.id !== null ? (
                <a
                  href={`${firstCellLinkBase}${s.id}${firstCellLinkSuffix}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit", textDecoration: "none", display: "block" }}
                >
                  {s.name}
                </a>
              ) : (
                s.name
              )

            return (
              <tr
                key={s.id ?? "__none__"}
                style={{ background: s.id === null ? "var(--color-light)" : "var(--color-white)" }}
              >
                <td style={{ ...tdBase, background: BG.name, textAlign: "left", fontWeight: s.id === null ? 400 : 600, color: s.id === null ? "var(--color-muted)" : "var(--color-text)" }}>
                  {nameCell}
                </td>
                <td style={{ ...tdBase, background: BG.trades }}>{s.trades}</td>
                <td style={{ ...tdBase, background: BG.metrics, color: s.winRate !== null ? (s.winRate >= 0.5 ? "#2D8C4E" : "#D96060") : "var(--color-muted)" }}>
                  {pct(s.winRate)}
                </td>
                <td style={{ ...tdBase, background: BG.metrics, color: s.avgR !== null ? (s.avgR > 0 ? "#2D8C4E" : s.avgR < 0 ? "#D96060" : undefined) : "var(--color-muted)" }}>
                  {s.avgR !== null ? s.avgR.toFixed(2) : "—"}
                </td>
                <td style={{ ...tdBase, background: BG.metrics, color: s.totalPnL > 0 ? "#2D8C4E" : s.totalPnL < 0 ? "#D96060" : undefined }}>
                  {s.totalPnL > 0 ? "+" : ""}{s.totalPnL.toFixed(2)}
                </td>
                <td style={{ ...tdBase, background: BG.metrics }}>{pf(s.profitFactor)}</td>
                <td style={{ ...tdBase, background: BG.direction }}>{s.long || "—"}</td>
                <td style={{ ...tdBase, background: BG.direction }}>{s.short || "—"}</td>
                <td style={{ ...tdBase, background: BG.tiers }}>{s.tierA || "—"}</td>
                <td style={{ ...tdBase, background: BG.tiers }}>{s.tierB || "—"}</td>
                <td style={{ ...tdBase, background: BG.tiers }}>{s.tierC || "—"}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run __tests__/lib/sortable-stats-table.test.ts
```

Expected: 7 tests PASS.

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/statistics/SortableStatsTable.tsx __tests__/lib/sortable-stats-table.test.ts
git commit -m "feat: add SortableStatsTable client component with sortRows"
```

---

## Task 2: Update statistics pages to use SortableStatsTable

**Files:**
- Modify: `app/(app)/statistics/page.tsx`
- Modify: `app/(app)/statistics/setup/[setupId]/page.tsx`

- [ ] **Step 1: Update main statistics page**

In `app/(app)/statistics/page.tsx`:

**Add import** at the top (after existing imports):
```typescript
import { SortableStatsTable } from "@/components/statistics/SortableStatsTable"
import type { StatsRow } from "@/components/statistics/SortableStatsTable"
```

**Remove** these now-unused local definitions (they were only used by the table):
- `const thBase: React.CSSProperties = { ... }`
- `const tdBase: React.CSSProperties = { ... }`
- `const A = "rgba(0,0,0,0.06)"`
- `const B = "rgba(80,120,220,0.05)"`
- `const G = { ... }`
- `const thStyle = ...`
- `const tdStyle = ...`

Keep `pct` and `pf` — they're still used by the global stat cards.

**Replace** the entire `{/* Per-setup table */}` block (the `<div style={{ overflowX: "auto" }}>...</div>` containing the table) with:

```typescript
{/* Per-setup table */}
<SortableStatsTable
  rows={setupStats.map((s): StatsRow => ({
    id: s.setupId,
    name: s.setupName,
    trades: s.trades,
    winRate: s.winRate,
    avgR: s.avgR,
    totalPnL: s.totalPnL,
    profitFactor: s.profitFactor,
    long: s.long,
    short: s.short,
    tierA: s.tierA,
    tierB: s.tierB,
    tierC: s.tierC,
  }))}
  firstColumnLabel="Setup"
  firstCellLinkBase="/statistics/setup/"
  firstCellLinkSuffix={qs ? `?${qs}` : ""}
/>
```

- [ ] **Step 2: Update drill-down statistics page**

In `app/(app)/statistics/setup/[setupId]/page.tsx`:

**Add import**:
```typescript
import { SortableStatsTable } from "@/components/statistics/SortableStatsTable"
import type { StatsRow } from "@/components/statistics/SortableStatsTable"
```

**Remove** these now-unused local definitions:
- `const thBase: React.CSSProperties = { ... }`
- `const tdBase: React.CSSProperties = { ... }`
- `const thStyle = ...`
- `const tdStyle = ...`

Keep `pct` and `pf` — still used by the global stat cards.

**Replace** the entire `{/* Per-trigger table */}` block with:

```typescript
{/* Per-trigger table */}
<SortableStatsTable
  rows={triggerStats.map((s): StatsRow => ({
    id: s.triggerId,
    name: s.triggerName,
    trades: s.trades,
    winRate: s.winRate,
    avgR: s.avgR,
    totalPnL: s.totalPnL,
    profitFactor: s.profitFactor,
    long: s.long,
    short: s.short,
    tierA: s.tierA,
    tierB: s.tierB,
    tierC: s.tierC,
  }))}
  firstColumnLabel="Trigger"
/>
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass (new 7 + existing 12 statistics tests).

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/statistics/page.tsx" "app/(app)/statistics/setup/[setupId]/page.tsx"
git commit -m "feat: use SortableStatsTable in statistics pages"
```
