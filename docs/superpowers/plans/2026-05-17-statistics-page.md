# Statistics Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/statistics` page showing per-setup trade performance with date range filtering and a global summary bar.

**Architecture:** Pure-function computation layer (`lib/statistics.ts`) fed by a single Prisma query in the server page. Filter state lives in URL params — a small client component handles param updates, everything else is server-rendered. No new DB models or migrations needed.

**Tech Stack:** Next.js 15 App Router, Prisma, TypeScript, Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/statistics.ts` | Create | Pure functions: `computeSetupStats`, `computeGlobalStats` |
| `__tests__/lib/statistics.test.ts` | Create | Unit tests for both compute functions |
| `components/statistics/StatisticsFilter.tsx` | Create | Client component: preset buttons + custom date picker, updates URL params |
| `app/(app)/statistics/page.tsx` | Create | Server component: reads params, queries DB, renders page |
| `app/(app)/dashboard/page.tsx` | Modify | Add "Statystyki" link button in tab row |

---

## Task 1: Computation helpers (`lib/statistics.ts`)

**Files:**
- Create: `lib/statistics.ts`
- Create: `__tests__/lib/statistics.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/statistics.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { computeSetupStats, computeGlobalStats } from "@/lib/statistics"
import type { TradeForStats } from "@/lib/statistics"

const t = (overrides: Partial<TradeForStats> = {}): TradeForStats => ({
  playbookSetupId: "s1",
  playbookSetup: { name: "Breakout" },
  direction: "long",
  tier: "A",
  rActual: 1.0,
  profitRaw: 100,
  ...overrides,
})

describe("computeSetupStats", () => {
  it("groups trades by setup and computes basic stats", () => {
    const trades = [
      t({ rActual: 1.0, profitRaw: 100 }),
      t({ rActual: -0.5, profitRaw: -50 }),
      t({ playbookSetupId: "s2", playbookSetup: { name: "FVG" }, rActual: 2.0, profitRaw: 200 }),
    ]
    const result = computeSetupStats(trades)
    expect(result).toHaveLength(2)
    expect(result[0].setupName).toBe("FVG")   // sorted by trade count desc... wait, both have different counts
    // s1 has 2 trades, s2 has 1 → s1 first
    expect(result[0].setupName).toBe("Breakout")
    expect(result[0].trades).toBe(2)
    expect(result[0].winRate).toBe(0.5)
    expect(result[0].avgR).toBe(0.25)
    expect(result[0].totalPnL).toBe(50)
    expect(result[0].profitFactor).toBe(2)
  })

  it("returns winRate null when no rActual values", () => {
    const trades = [t({ rActual: null })]
    const result = computeSetupStats(trades)
    expect(result[0].winRate).toBeNull()
    expect(result[0].avgR).toBeNull()
  })

  it("returns profitFactor '∞' when no losing trades", () => {
    const trades = [t({ profitRaw: 100 }), t({ profitRaw: 200 })]
    const result = computeSetupStats(trades)
    expect(result[0].profitFactor).toBe("∞")
  })

  it("returns profitFactor '—' when no profitRaw values", () => {
    const trades = [t({ profitRaw: null })]
    const result = computeSetupStats(trades)
    expect(result[0].profitFactor).toBe("—")
  })

  it("counts long/short and tiers correctly", () => {
    const trades = [
      t({ direction: "long", tier: "A" }),
      t({ direction: "short", tier: "B" }),
      t({ direction: "long", tier: "A" }),
    ]
    const result = computeSetupStats(trades)
    expect(result[0].long).toBe(2)
    expect(result[0].short).toBe(1)
    expect(result[0].tierA).toBe(2)
    expect(result[0].tierB).toBe(1)
    expect(result[0].tierC).toBe(0)
  })

  it("places 'Bez setupu' last regardless of trade count", () => {
    const trades = [
      t({ playbookSetupId: null, playbookSetup: null }),
      t({ playbookSetupId: null, playbookSetup: null }),
      t({ playbookSetupId: null, playbookSetup: null }),
      t({ playbookSetupId: "s1", playbookSetup: { name: "Breakout" } }),
    ]
    const result = computeSetupStats(trades)
    expect(result[result.length - 1].setupId).toBeNull()
    expect(result[result.length - 1].setupName).toBe("Bez setupu")
  })
})

describe("computeGlobalStats", () => {
  it("computes totals across all trades", () => {
    const trades = [
      t({ rActual: 1.0, profitRaw: 100 }),
      t({ rActual: -0.5, profitRaw: -50 }),
    ]
    const result = computeGlobalStats(trades)
    expect(result.trades).toBe(2)
    expect(result.winRate).toBe(0.5)
    expect(result.avgR).toBe(0.25)
    expect(result.totalPnL).toBe(50)
    expect(result.profitFactor).toBe(2)
  })

  it("handles empty trade list", () => {
    const result = computeGlobalStats([])
    expect(result.trades).toBe(0)
    expect(result.winRate).toBeNull()
    expect(result.avgR).toBeNull()
    expect(result.totalPnL).toBe(0)
    expect(result.profitFactor).toBe("—")
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/lib/statistics.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/statistics'"

- [ ] **Step 3: Implement `lib/statistics.ts`**

```typescript
export type TradeForStats = {
  playbookSetupId: string | null
  playbookSetup: { name: string } | null
  direction: string | null
  tier: string | null
  rActual: number | null
  profitRaw: number | null
}

export type SetupStats = {
  setupId: string | null
  setupName: string
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

export type GlobalStats = {
  trades: number
  winRate: number | null
  avgR: number | null
  totalPnL: number
  profitFactor: number | string
}

function pfactor(trades: TradeForStats[]): number | string {
  const withPnL = trades.filter(t => t.profitRaw !== null)
  if (withPnL.length === 0) return "—"
  const grossProfit = withPnL.filter(t => t.profitRaw! > 0).reduce((s, t) => s + t.profitRaw!, 0)
  const grossLoss = Math.abs(withPnL.filter(t => t.profitRaw! < 0).reduce((s, t) => s + t.profitRaw!, 0))
  if (grossLoss === 0) return grossProfit > 0 ? "∞" : "—"
  return Math.round((grossProfit / grossLoss) * 100) / 100
}

export function computeSetupStats(trades: TradeForStats[]): SetupStats[] {
  const groups = new Map<string | null, TradeForStats[]>()
  for (const trade of trades) {
    const key = trade.playbookSetupId
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(trade)
  }

  const results: SetupStats[] = []
  for (const [setupId, g] of groups) {
    const withR = g.filter(t => t.rActual !== null)
    const wins = withR.filter(t => t.rActual! > 0)
    const winRate = withR.length > 0 ? wins.length / withR.length : null
    const avgR = withR.length > 0
      ? Math.round(withR.reduce((s, t) => s + t.rActual!, 0) / withR.length * 100) / 100
      : null
    const totalPnL = Math.round(
      g.filter(t => t.profitRaw !== null).reduce((s, t) => s + t.profitRaw!, 0) * 100
    ) / 100

    results.push({
      setupId,
      setupName: setupId === null ? "Bez setupu" : (g[0].playbookSetup?.name ?? "Bez setupu"),
      trades: g.length,
      winRate,
      avgR,
      totalPnL,
      profitFactor: pfactor(g),
      long: g.filter(t => t.direction === "long").length,
      short: g.filter(t => t.direction === "short").length,
      tierA: g.filter(t => t.tier === "A").length,
      tierB: g.filter(t => t.tier === "B").length,
      tierC: g.filter(t => t.tier === "C").length,
    })
  }

  return results.sort((a, b) => {
    if (a.setupId === null) return 1
    if (b.setupId === null) return -1
    return b.trades - a.trades
  })
}

export function computeGlobalStats(trades: TradeForStats[]): GlobalStats {
  if (trades.length === 0) return { trades: 0, winRate: null, avgR: null, totalPnL: 0, profitFactor: "—" }
  const withR = trades.filter(t => t.rActual !== null)
  const wins = withR.filter(t => t.rActual! > 0)
  const winRate = withR.length > 0 ? wins.length / withR.length : null
  const avgR = withR.length > 0
    ? Math.round(withR.reduce((s, t) => s + t.rActual!, 0) / withR.length * 100) / 100
    : null
  const totalPnL = Math.round(
    trades.filter(t => t.profitRaw !== null).reduce((s, t) => s + t.profitRaw!, 0) * 100
  ) / 100
  return { trades: trades.length, winRate, avgR, totalPnL, profitFactor: pfactor(trades) }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/lib/statistics.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/statistics.ts __tests__/lib/statistics.test.ts
git commit -m "feat: statistics computation helpers with tests"
```

---

## Task 2: Filter client component

**Files:**
- Create: `components/statistics/StatisticsFilter.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"

const PRESETS = [
  { label: "2 tygodnie", value: "2w" },
  { label: "4 tygodnie", value: "4w" },
  { label: "3 miesiące", value: "3m" },
  { label: "Wszystko", value: "all" },
]

export function StatisticsFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const range = params.get("range")
  const from = params.get("from") ?? ""
  const to = params.get("to") ?? ""
  const hasCustom = !!(params.get("from") || params.get("to"))

  function setPreset(value: string) {
    router.push(`/statistics?range=${value}`)
  }

  function setCustom(field: "from" | "to", value: string) {
    const next = new URLSearchParams()
    if (field === "from") {
      if (value) next.set("from", value)
      if (to) next.set("to", to)
    } else {
      if (from) next.set("from", from)
      if (value) next.set("to", value)
    }
    router.push(`/statistics?${next.toString()}`)
  }

  const activePreset = hasCustom ? null : (range ?? "4w")

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      {PRESETS.map((p) => (
        <button
          key={p.value}
          onClick={() => setPreset(p.value)}
          style={{
            padding: "4px 12px",
            fontSize: "var(--font-size-tiny)",
            fontWeight: 700,
            border: "1px solid var(--color-border)",
            borderRadius: 2,
            cursor: "pointer",
            background: activePreset === p.value ? "var(--color-mid)" : "var(--color-light)",
            color: activePreset === p.value ? "#fff" : "var(--color-muted)",
          }}
        >
          {p.label}
        </button>
      ))}

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
        <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>Od</span>
        <input
          type="date"
          value={from}
          onChange={(e) => setCustom("from", e.target.value)}
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: 2,
            padding: "3px 6px",
            fontSize: "var(--font-size-tiny)",
            color: "var(--color-text)",
            background: hasCustom ? "var(--color-light)" : "transparent",
            outline: "none",
          }}
        />
        <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>Do</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setCustom("to", e.target.value)}
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: 2,
            padding: "3px 6px",
            fontSize: "var(--font-size-tiny)",
            color: "var(--color-text)",
            background: hasCustom ? "var(--color-light)" : "transparent",
            outline: "none",
          }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "npm warn"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/statistics/StatisticsFilter.tsx
git commit -m "feat: statistics date range filter component"
```

---

## Task 3: Statistics page

**Files:**
- Create: `app/(app)/statistics/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Suspense } from "react"
import { StatisticsFilter } from "@/components/statistics/StatisticsFilter"
import { computeSetupStats, computeGlobalStats } from "@/lib/statistics"

function getDateRange(
  range: string | undefined,
  from: string | undefined,
  to: string | undefined
): { start: Date | null; end: Date | null } {
  if (from && to) return { start: new Date(from), end: new Date(to) }
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  switch (range) {
    case "2w": return { start: new Date(now.getTime() - 14 * 86400000), end }
    case "3m": return { start: new Date(now.getTime() - 90 * 86400000), end }
    case "all": return { start: null, end: null }
    default:   return { start: new Date(now.getTime() - 28 * 86400000), end }
  }
}

function fmt(n: number | null, suffix = ""): string {
  if (n === null) return "—"
  return (n > 0 ? "+" : "") + n.toFixed(2) + suffix
}
function pct(n: number | null): string {
  if (n === null) return "—"
  return (n * 100).toFixed(0) + "%"
}
function pf(v: number | string): string {
  if (typeof v === "string") return v
  return v.toFixed(2)
}

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const { range, from, to } = await searchParams
  const { start, end } = getDateRange(range, from, to)

  const where: any = { dailyCard: { userId } }
  if (start || end) {
    where.dailyCard.date = {}
    if (start) where.dailyCard.date.gte = start
    if (end)   where.dailyCard.date.lt  = end
  }

  const trades = await prisma.trade.findMany({
    where,
    include: {
      playbookSetup: { select: { name: true } },
    },
  })

  const setupStats = computeSetupStats(trades)
  const global = computeGlobalStats(trades)

  const thStyle: React.CSSProperties = {
    background: "var(--color-mid)",
    color: "#fff",
    padding: "5px 8px",
    fontSize: "var(--font-size-tiny)",
    fontWeight: 600,
    textAlign: "center",
    whiteSpace: "nowrap",
  }
  const tdStyle: React.CSSProperties = {
    padding: "4px 8px",
    fontSize: "var(--font-size-tiny)",
    textAlign: "center",
    borderBottom: "0.5px solid var(--color-border)",
    verticalAlign: "middle",
  }

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
          <Link
            href="/dashboard"
            className="font-bold uppercase tracking-widest"
            style={{ color: "var(--color-gold)", fontSize: "var(--font-size-tiny)", textDecoration: "none" }}
          >
            THE FORGE
          </Link>
          <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px" }}>
            Statystyki
          </span>
        </div>
      </header>

      <main
        className="mx-auto px-4 py-6 flex flex-col gap-6"
        style={{ maxWidth: "var(--content-max-width)" }}
      >
        {/* Filter */}
        <Suspense>
          <StatisticsFilter />
        </Suspense>

        {/* Global summary */}
        {trades.length === 0 ? (
          <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
            Brak transakcji w wybranym okresie.
          </p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {[
                { label: "Transakcji", value: String(global.trades), neutral: true },
                { label: "Win Rate",   value: pct(global.winRate), positive: (global.winRate ?? 0) >= 0.5 },
                { label: "Avg R",      value: global.avgR !== null ? global.avgR.toFixed(2) : "—", positive: (global.avgR ?? 0) > 0 },
                { label: "P&L ($)",    value: global.totalPnL !== 0 ? fmt(global.totalPnL) : "0.00", positive: global.totalPnL > 0, negative: global.totalPnL < 0 },
                { label: "Prof. Factor", value: pf(global.profitFactor), positive: typeof global.profitFactor === "number" && global.profitFactor >= 1.5 },
              ].map(({ label, value, neutral, positive, negative }) => (
                <div
                  key={label}
                  style={{
                    background: "var(--color-white)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 4,
                    padding: "10px 8px",
                    textAlign: "center",
                  }}
                >
                  <div style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: neutral ? "var(--color-text)" : positive ? "#2D8C4E" : negative ? "#D96060" : "var(--color-text)",
                  }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Per-setup table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: "left" }}>Setup</th>
                    <th style={thStyle}>Trades</th>
                    <th style={thStyle}>Win Rate</th>
                    <th style={thStyle}>Avg R</th>
                    <th style={thStyle}>P&amp;L ($)</th>
                    <th style={thStyle}>Profit Factor</th>
                    <th style={thStyle}>Long</th>
                    <th style={thStyle}>Short</th>
                    <th style={thStyle}>Tier A</th>
                    <th style={thStyle}>Tier B</th>
                    <th style={thStyle}>Tier C</th>
                  </tr>
                </thead>
                <tbody>
                  {setupStats.map((s) => (
                    <tr
                      key={s.setupId ?? "__none__"}
                      style={{ background: s.setupId === null ? "var(--color-light)" : "var(--color-white)" }}
                    >
                      <td style={{ ...tdStyle, textAlign: "left", fontWeight: s.setupId === null ? 400 : 600, color: s.setupId === null ? "var(--color-muted)" : "var(--color-text)" }}>
                        {s.setupName}
                      </td>
                      <td style={tdStyle}>{s.trades}</td>
                      <td style={{ ...tdStyle, color: s.winRate !== null ? (s.winRate >= 0.5 ? "#2D8C4E" : "#D96060") : "var(--color-muted)" }}>
                        {pct(s.winRate)}
                      </td>
                      <td style={{ ...tdStyle, color: s.avgR !== null ? (s.avgR > 0 ? "#2D8C4E" : s.avgR < 0 ? "#D96060" : undefined) : "var(--color-muted)" }}>
                        {s.avgR !== null ? s.avgR.toFixed(2) : "—"}
                      </td>
                      <td style={{ ...tdStyle, color: s.totalPnL > 0 ? "#2D8C4E" : s.totalPnL < 0 ? "#D96060" : undefined }}>
                        {s.totalPnL > 0 ? "+" : ""}{s.totalPnL.toFixed(2)}
                      </td>
                      <td style={tdStyle}>{pf(s.profitFactor)}</td>
                      <td style={tdStyle}>{s.long || "—"}</td>
                      <td style={tdStyle}>{s.short || "—"}</td>
                      <td style={tdStyle}>{s.tierA || "—"}</td>
                      <td style={tdStyle}>{s.tierB || "—"}</td>
                      <td style={tdStyle}>{s.tierC || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "npm warn"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/(app)/statistics/page.tsx
git commit -m "feat: statistics page — global summary + per-setup table"
```

---

## Task 4: Dashboard button

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Add "Statystyki" button to the tab row**

In `app/(app)/dashboard/page.tsx`, find the tab buttons block (the one with Historia / Kalibracja / Playbook) and add the Statystyki link **before** the closing `</div>` of the tab row:

```tsx
          {/* Tab buttons */}
          <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
            {([
              { key: "historia",   label: "Historia",   href: "/dashboard" },
              { key: "kalibracja", label: "Kalibracja", href: "/dashboard?tab=kalibracja" },
              { key: "playbook",   label: "Playbook",   href: "/dashboard?tab=playbook" },
            ] as const).map(({ key, label, href }) => (
              <a
                key={key}
                href={href}
                style={{
                  padding: "5px 14px",
                  fontSize: "var(--font-size-tiny)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  textDecoration: "none",
                  borderRadius: 2,
                  background: activeTab === key ? "var(--color-mid)" : "var(--color-light)",
                  color: activeTab === key ? "#fff" : "var(--color-muted)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {label}
              </a>
            ))}
            <a
              href="/statistics"
              style={{
                padding: "5px 14px",
                fontSize: "var(--font-size-tiny)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                textDecoration: "none",
                borderRadius: 2,
                background: "var(--color-light)",
                color: "var(--color-muted)",
                border: "1px solid var(--color-border)",
                marginLeft: 8,
              }}
            >
              Statystyki →
            </a>
          </div>
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "npm warn"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/(app)/dashboard/page.tsx
git commit -m "feat: add Statystyki link to dashboard tab row"
```

---

## Self-Review Checklist

- [x] Spec: navigation → Task 4 (dashboard button)
- [x] Spec: date filter presets + custom picker → Task 2 (StatisticsFilter)
- [x] Spec: custom `from`/`to` overrides preset → handled in `StatisticsFilter` + `getDateRange`
- [x] Spec: global summary bar (Trades, Win Rate, Avg R, P&L, Profit Factor) → Task 3
- [x] Spec: per-setup table with all 11 columns → Task 3
- [x] Spec: "Bez setupu" row at bottom → `computeSetupStats` sort + Task 3 render
- [x] Spec: Win Rate = null when no rActual → Task 1 + tested
- [x] Spec: Profit Factor "∞" / "—" edge cases → Task 1 + tested
- [x] Spec: no new DB models → confirmed (single Prisma query, no migrations)
- [x] Types consistent across tasks: `TradeForStats`, `SetupStats`, `GlobalStats` defined in Task 1, used in Tasks 2–3
