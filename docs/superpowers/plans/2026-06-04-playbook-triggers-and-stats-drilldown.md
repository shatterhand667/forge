# Playbook Triggers + Statistics Drill-down Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add structured Trigger dictionary to the Playbook, replace the free-text trigger column in the Trade Log with a FK-backed overlay-select, and add a per-setup drill-down page in Statistics showing trigger-level metrics.

**Architecture:** New `PlaybookTrigger` model mirrors `PlaybookSetup` — global list owned by the Playbook, referenced by `Trade.playbookTriggerId`. Statistics drill-down at `/statistics/setup/[setupId]` reuses existing `StatisticsFilter`, stat cards, and table layout, adding a new `computeTriggerStats` function that mirrors `computeSetupStats`.

**Tech Stack:** Next.js 14 App Router, Prisma (PostgreSQL), Vitest, TypeScript

---

## File Map

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `PlaybookTrigger` model; add `playbookTriggerId` + relation to `Trade`; add `triggers` relation to `Playbook` |
| `actions/playbook.ts` | Add `createTrigger`, `updateTrigger`, `deleteTrigger`, `getPlaybookTriggers`; update `getPlaybook` to include triggers |
| `components/dashboard/PlaybookView.tsx` | Add `Trigger` type, `TriggerCard` component, Triggery section |
| `components/wizard/steps/evening/Step6TradeLog.tsx` | Replace `trigger` textarea column with `playbookTriggerId` overlay-select |
| `app/(app)/cards/[date]/evening/[step]/page.tsx` | Call `getPlaybookTriggers()` and pass to `Step6TradeLog` for step 6 |
| `lib/statistics.ts` | Add `TradeForTriggerStats` type, `TriggerStats` type, `computeTriggerStats` function |
| `__tests__/lib/statistics.test.ts` | Add tests for `computeTriggerStats` |
| `app/(app)/statistics/setup/[setupId]/page.tsx` | New: drill-down page for a single setup |
| `app/(app)/statistics/page.tsx` | Make setup rows clickable links to drill-down page |

---

## Task 1: Prisma Migration — PlaybookTrigger model + Trade.playbookTriggerId

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update schema.prisma**

In `prisma/schema.prisma`, make these three changes:

**1a — Add `triggers` to `Playbook` model** (after `setups PlaybookSetup[]`):
```prisma
  setups    PlaybookSetup[]
  triggers  PlaybookTrigger[]
  createdAt DateTime        @default(now())
```

**1b — Add `playbookTriggerId` to `Trade` model** (after the existing `playbookSetup` relation):
```prisma
  playbookTriggerId String?
  playbookTrigger   PlaybookTrigger? @relation(fields: [playbookTriggerId], references: [id], onDelete: SetNull)
```

**1c — Add new `PlaybookTrigger` model** (after the `PlaybookSetup` model):
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

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_playbook_triggers
```

Expected: migration created and applied, no errors.

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: "Generated Prisma Client" with no type errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add PlaybookTrigger model and Trade.playbookTriggerId FK"
```

---

## Task 2: Server Actions for Triggers

**Files:**
- Modify: `actions/playbook.ts`

- [ ] **Step 1: Update imports and getPlaybook**

In `actions/playbook.ts`, update `getPlaybook` to include triggers:

```typescript
export async function getPlaybook() {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.playbook.findUnique({
    where: { userId: session.user.id },
    include: {
      setups: { orderBy: { order: "asc" } },
      triggers: { orderBy: { order: "asc" } },
    },
  })
}
```

- [ ] **Step 2: Add trigger actions**

Append to `actions/playbook.ts` after `deleteSetup`:

```typescript
export async function createTrigger() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  const pb = await prisma.playbook.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true, triggers: { select: { order: true } } },
  })

  const maxOrder = pb.triggers.reduce((m, t) => Math.max(m, t.order), -1)

  const trigger = await prisma.playbookTrigger.create({
    data: { playbookId: pb.id, order: maxOrder + 1 },
  })
  revalidatePath("/dashboard")
  return trigger
}

export async function updateTrigger(
  id: string,
  data: Partial<{ name: string; description: string | null }>
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.playbookTrigger.update({ where: { id }, data })
  revalidatePath("/dashboard")
}

export async function deleteTrigger(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.playbookTrigger.delete({ where: { id } })
  revalidatePath("/dashboard")
}

export async function getPlaybookTriggers() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.playbookTrigger.findMany({
    where: { playbook: { userId: session.user.id } },
    select: { id: true, name: true },
    orderBy: { order: "asc" },
  })
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add actions/playbook.ts
git commit -m "feat: add trigger server actions (create, update, delete, get)"
```

---

## Task 3: TriggerCard + Triggery Section in PlaybookView

**Files:**
- Modify: `components/dashboard/PlaybookView.tsx`

- [ ] **Step 1: Update imports**

At the top of `PlaybookView.tsx`, update the import from `@/actions/playbook`:

```typescript
import {
  savePlaybookField,
  savePlaybookJson,
  createSetup,
  updateSetup,
  deleteSetup,
  createTrigger,
  updateTrigger,
  deleteTrigger,
} from "@/actions/playbook"
```

- [ ] **Step 2: Add Trigger type and update Playbook type**

After the existing `Setup` type definition, add:

```typescript
type Trigger = {
  id: string
  name: string
  description: string | null
  order: number
}
```

In the `Playbook` type, add `triggers: Trigger[]` after `setups: Setup[]`:

```typescript
type Playbook = {
  // ... all existing fields unchanged ...
  setups: Setup[]
  triggers: Trigger[]
}
```

- [ ] **Step 3: Add TriggerCard component**

Add the `TriggerCard` component after the `SetupCard` component definition (before `// ── main component`):

```typescript
// ── trigger card ───────────────────────────────────────────────────────────────

function TriggerCard({ trigger, onDelete }: { trigger: Trigger; onDelete: () => void }) {
  const [name, setName] = useState(trigger.name ?? "")
  const [desc, setDesc] = useState(trigger.description ?? "")
  const [, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(true)

  function save(data: Parameters<typeof updateTrigger>[1]) {
    startTransition(async () => {
      await updateTrigger(trigger.id, data)
    })
  }

  function handleDelete() {
    if (!confirm(`Usunąć trigger "${name || "bez nazwy"}"?`)) return
    startTransition(async () => {
      await deleteTrigger(trigger.id)
      onDelete()
    })
  }

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: 4,
        marginBottom: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "var(--color-light)",
          borderBottom: expanded ? "1px solid var(--color-border)" : "none",
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-muted)",
            fontSize: 10,
            padding: 0,
            flexShrink: 0,
          }}
        >
          {expanded ? "▾" : "▸"}
        </button>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => save({ name })}
          placeholder="Nazwa triggera..."
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontWeight: 600,
            fontSize: "var(--font-size-tiny)",
            color: "var(--color-text)",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleDelete}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-muted)",
            fontSize: 14,
            padding: "0 2px",
            lineHeight: 1,
          }}
          title="Usuń trigger"
        >
          ×
        </button>
      </div>

      {expanded && (
        <div style={{ padding: "8px 12px" }}>
          <div style={{ ...fieldRowStyle, borderBottom: "none" }}>
            <span style={labelStyle}>Opis:</span>
            <AutoTextarea
              value={desc}
              onChange={setDesc}
              onBlur={() => save({ description: desc || null })}
              placeholder="Opcjonalny opis triggera..."
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Update PlaybookView — state and handlers**

In `PlaybookView`, update the `pb` fallback to include `triggers`:

```typescript
const pb = initial ?? {
  tierADescription: null, tierACriteria: null, tierAMarketContext: null,
  tierAInvalidation: null, tierANotes: null,
  tierBDescription: null, tierBCriteria: null, tierBMarketContext: null,
  tierBInvalidation: null, tierBNotes: null,
  tierCDescription: null, tierCCriteria: null, tierCMarketContext: null,
  tierCInvalidation: null, tierCNotes: null,
  maxDailyLoss: null, maxWeeklyLoss: null, maxRiskPerTrade: null,
  maxOpenPositions: null, hardRules: null,
  setups: [],
  triggers: [],
}
```

Add trigger state alongside the existing setup state:

```typescript
const [triggers, setTriggers] = useState<Trigger[]>(pb.triggers)
const [triggersOpen, setTriggersOpen] = useState(false)
```

Add handlers (alongside `handleAddSetup` / `handleDeleteSetup`):

```typescript
async function handleAddTrigger() {
  const t = await createTrigger()
  setTriggers((prev) => [...prev, t as Trigger])
}

function handleDeleteTrigger(id: string) {
  setTriggers((prev) => prev.filter((t) => t.id !== id))
}
```

- [ ] **Step 5: Add Triggery section to JSX**

In the `return (...)` of `PlaybookView`, add the Triggery section **before** the existing `{/* SETUPY */}` comment block:

```typescript
{/* TRIGGERY */}
<button
  onClick={() => setTriggersOpen((v) => !v)}
  style={{ ...sectionHeaderStyle, width: "100%", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", border: "none" }}
>
  <span>Triggery ({triggers.length})</span>
  <span style={{ fontSize: 12 }}>{triggersOpen ? "▾" : "▸"}</span>
</button>

{triggersOpen && triggers.map((t) => (
  <TriggerCard key={t.id} trigger={t} onDelete={() => handleDeleteTrigger(t.id)} />
))}

{triggersOpen && (
  <button
    onClick={handleAddTrigger}
    style={{
      width: "100%",
      padding: "8px",
      border: "1px dashed var(--color-border)",
      borderRadius: 4,
      background: "transparent",
      color: "var(--color-muted)",
      fontSize: "var(--font-size-tiny)",
      cursor: "pointer",
      textAlign: "center",
      marginBottom: 16,
    }}
  >
    + Dodaj trigger
  </button>
)}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/dashboard/PlaybookView.tsx
git commit -m "feat: add Trigger tab to PlaybookView with TriggerCard component"
```

---

## Task 4: Replace Trigger Textarea with Overlay-Select in Step6TradeLog

**Files:**
- Modify: `components/wizard/steps/evening/Step6TradeLog.tsx`

- [ ] **Step 1: Add PlaybookTrigger type and update Props**

After the existing `type PlaybookSetup = ...` line, add:

```typescript
type PlaybookTrigger = { id: string; name: string }
```

Update `interface Props`:

```typescript
interface Props {
  card: DailyCard & { trades: Trade[]; emotionEntries: any[]; screenshots: DailyCardScreenshot[] }
  date: string
  step: number
  playbookSetups: PlaybookSetup[]
  playbookTriggers: PlaybookTrigger[]
}
```

Update the function signature:

```typescript
export function Step6TradeLog({ card, date, step, playbookSetups, playbookTriggers }: Props) {
```

- [ ] **Step 2: Update TRADE_COLUMNS**

Replace the trigger column definition:

```typescript
// Before:
{ id: "trigger",          label: "Trigger",  width: "10%", type: "textarea" as const },

// After:
{ id: "playbookTriggerId", label: "Trigger",  width: "10%" },
```

- [ ] **Step 3: Add playbookTriggerId rendering case**

In the table cell rendering (inside the `{TRADE_COLUMNS.map(col => (...))}` section), add a new condition for `playbookTriggerId` immediately after the `col.id === "playbookSetupId"` block:

```typescript
} else if (col.id === "playbookTriggerId") ? (
```

Wait — use the same ternary chain structure as the existing code. After:

```typescript
{col.id === "playbookSetupId" ? (
  // ... existing playbookSetupId block ...
) : col.id === "direction" ? (
```

Insert:

```typescript
{col.id === "playbookSetupId" ? (
  // ... existing playbookSetupId block — unchanged ...
) : col.id === "playbookTriggerId" ? (
  <div style={{ position: "relative" }}>
    <div
      style={{
        fontSize: "var(--font-size-tiny)",
        whiteSpace: "normal",
        wordBreak: "break-word",
        textAlign: "center",
        minHeight: "1.4em",
        padding: "2px 0",
        color: "var(--color-text)",
      }}
    >
      {playbookTriggers.find(
        (t) => t.id === String((trade as any).playbookTriggerId ?? "")
      )?.name || "—"}
    </div>
    <select
      value={String((trade as any).playbookTriggerId ?? "")}
      onChange={(e) =>
        handleUpdateRow(i, "playbookTriggerId", e.target.value || null)
      }
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0,
        cursor: "pointer",
        width: "100%",
        height: "100%",
        fontSize: "var(--font-size-tiny)",
      }}
    >
      <option value="">—</option>
      {playbookTriggers.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  </div>
) : col.id === "direction" ? (
  // ... existing direction block — unchanged ...
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/wizard/steps/evening/Step6TradeLog.tsx
git commit -m "feat: replace trigger textarea with playbookTriggerId overlay-select in trade log"
```

---

## Task 5: Pass playbookTriggers from Evening Card Page

**Files:**
- Modify: `app/(app)/cards/[date]/evening/[step]/page.tsx`

- [ ] **Step 1: Update import**

Add `getPlaybookTriggers` to the import from `@/actions/playbook`:

```typescript
import { getPlaybookSetups, getPlaybookTriggers } from "@/actions/playbook"
```

- [ ] **Step 2: Fetch and pass triggers in step 6 branch**

Replace the step 6 block:

```typescript
// Before:
if (step === 6) {
  const playbookSetups = await getPlaybookSetups()
  return <Step6TradeLog card={card} date={date} step={step} playbookSetups={playbookSetups} />
}

// After:
if (step === 6) {
  const [playbookSetups, playbookTriggers] = await Promise.all([
    getPlaybookSetups(),
    getPlaybookTriggers(),
  ])
  return (
    <Step6TradeLog
      card={card}
      date={date}
      step={step}
      playbookSetups={playbookSetups}
      playbookTriggers={playbookTriggers}
    />
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/cards/[date]/evening/[step]/page.tsx"
git commit -m "feat: pass playbookTriggers to Step6TradeLog"
```

---

## Task 6: computeTriggerStats — Test First

**Files:**
- Modify: `lib/statistics.ts`
- Modify: `__tests__/lib/statistics.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `__tests__/lib/statistics.test.ts`:

```typescript
import { computeTriggerStats } from "@/lib/statistics"
import type { TradeForTriggerStats } from "@/lib/statistics"

const trig = (overrides: Partial<TradeForTriggerStats> = {}): TradeForTriggerStats => ({
  playbookSetupId: "s1",
  playbookSetup: { name: "Breakout" },
  playbookTriggerId: "tr1",
  playbookTrigger: { name: "Candle Close Above HH" },
  direction: "long",
  tier: "A",
  rActual: 1.0,
  profitRaw: 100,
  ...overrides,
})

describe("computeTriggerStats", () => {
  it("groups trades by trigger and computes basic stats", () => {
    const trades = [
      trig({ rActual: 1.0, profitRaw: 100 }),
      trig({ rActual: -0.5, profitRaw: -50 }),
      trig({
        playbookTriggerId: "tr2",
        playbookTrigger: { name: "Volume Spike" },
        rActual: 2.0,
        profitRaw: 200,
      }),
    ]
    const result = computeTriggerStats(trades)
    expect(result).toHaveLength(2)
    expect(result[0].triggerName).toBe("Candle Close Above HH")
    expect(result[0].trades).toBe(2)
    expect(result[0].winRate).toBe(0.5)
    expect(result[0].avgR).toBe(0.25)
    expect(result[0].totalPnL).toBe(50)
  })

  it("places 'Bez triggera' last", () => {
    const trades = [
      trig({ playbookTriggerId: null, playbookTrigger: null }),
      trig({ playbookTriggerId: null, playbookTrigger: null }),
      trig({ playbookTriggerId: "tr1" }),
    ]
    const result = computeTriggerStats(trades)
    expect(result[result.length - 1].triggerId).toBeNull()
    expect(result[result.length - 1].triggerName).toBe("Bez triggera")
  })

  it("counts long/short and tiers correctly", () => {
    const trades = [
      trig({ direction: "long", tier: "A" }),
      trig({ direction: "short", tier: "B" }),
    ]
    const result = computeTriggerStats(trades)
    expect(result[0].long).toBe(1)
    expect(result[0].short).toBe(1)
    expect(result[0].tierA).toBe(1)
    expect(result[0].tierB).toBe(1)
  })

  it("returns winRate null when no rActual values", () => {
    const trades = [trig({ rActual: null })]
    const result = computeTriggerStats(trades)
    expect(result[0].winRate).toBeNull()
    expect(result[0].avgR).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run __tests__/lib/statistics.test.ts
```

Expected: `computeTriggerStats` and `TradeForTriggerStats` are not found — FAIL.

- [ ] **Step 3: Implement in lib/statistics.ts**

Add to `lib/statistics.ts` after the existing `TradeForStats` type:

```typescript
export type TradeForTriggerStats = TradeForStats & {
  playbookTriggerId: string | null
  playbookTrigger: { name: string } | null
}

export type TriggerStats = {
  triggerId: string | null
  triggerName: string
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
```

Then add the function after `computeGlobalStats`:

```typescript
export function computeTriggerStats(trades: TradeForTriggerStats[]): TriggerStats[] {
  const groups = new Map<string | null, TradeForTriggerStats[]>()
  for (const trade of trades) {
    const key = trade.playbookTriggerId
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(trade)
  }

  const results: TriggerStats[] = []
  for (const [triggerId, g] of groups) {
    const withR = g.filter((t) => t.rActual !== null)
    const wins = withR.filter((t) => t.rActual! > 0)
    const winRate = withR.length > 0 ? wins.length / withR.length : null
    const avgR =
      withR.length > 0
        ? Math.round((withR.reduce((s, t) => s + t.rActual!, 0) / withR.length) * 100) / 100
        : null
    const totalPnL =
      Math.round(
        g.filter((t) => t.profitRaw !== null).reduce((s, t) => s + t.profitRaw!, 0) * 100
      ) / 100

    results.push({
      triggerId,
      triggerName:
        triggerId === null ? "Bez triggera" : (g[0].playbookTrigger?.name ?? "Bez triggera"),
      trades: g.length,
      winRate,
      avgR,
      totalPnL,
      profitFactor: pfactor(g),
      long: g.filter((t) => t.direction === "long").length,
      short: g.filter((t) => t.direction === "short").length,
      tierA: g.filter((t) => t.tier === "A").length,
      tierB: g.filter((t) => t.tier === "B").length,
      tierC: g.filter((t) => t.tier === "C").length,
    })
  }

  return results.sort((a, b) => {
    if (a.triggerId === null) return 1
    if (b.triggerId === null) return -1
    return b.trades - a.trades
  })
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run __tests__/lib/statistics.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/statistics.ts __tests__/lib/statistics.test.ts
git commit -m "feat: add computeTriggerStats with TradeForTriggerStats type"
```

---

## Task 7: New Statistics Drill-down Page

**Files:**
- Create: `app/(app)/statistics/setup/[setupId]/page.tsx`

- [ ] **Step 1: Create the page file**

Create `app/(app)/statistics/setup/[setupId]/page.tsx`:

```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Suspense } from "react"
import { StatisticsFilter } from "@/components/statistics/StatisticsFilter"
import { computeTriggerStats, computeGlobalStats } from "@/lib/statistics"
import type { TradeForTriggerStats } from "@/lib/statistics"

function getDateRange(
  range: string | undefined,
  from: string | undefined,
  to: string | undefined
): { start: Date | null; end: Date | null } {
  if (from && to) {
    const end = new Date(to)
    end.setUTCDate(end.getUTCDate() + 1)
    return { start: new Date(from), end }
  }
  const now = new Date()
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  switch (range) {
    case "2w": return { start: new Date(now.getTime() - 14 * 86400000), end }
    case "3m": return { start: new Date(now.getTime() - 90 * 86400000), end }
    case "all": return { start: null, end: null }
    default:   return { start: new Date(now.getTime() - 28 * 86400000), end }
  }
}

function pct(n: number | null): string {
  if (n === null) return "—"
  return (n * 100).toFixed(0) + "%"
}

function pf(v: number | string): string {
  if (typeof v === "string") return v
  return v.toFixed(2)
}

export default async function SetupDrilldownPage({
  params,
  searchParams,
}: {
  params: Promise<{ setupId: string }>
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const { setupId } = await params
  const { range, from, to } = await searchParams
  const { start, end } = getDateRange(range, from, to)

  const setup = await prisma.playbookSetup.findFirst({
    where: { id: setupId, playbook: { userId } },
    select: { name: true },
  })

  if (!setup) redirect("/statistics")

  const dateFilter: { gte?: Date; lt?: Date } = {}
  if (start) dateFilter.gte = start
  if (end) dateFilter.lt = end

  const trades = await prisma.trade.findMany({
    where: {
      playbookSetupId: setupId,
      dailyCard: {
        userId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
    },
    include: {
      playbookSetup: { select: { name: true } },
      playbookTrigger: { select: { name: true } },
    },
  }) as TradeForTriggerStats[]

  const triggerStats = computeTriggerStats(trades)
  const global = computeGlobalStats(trades)

  const thBase: React.CSSProperties = {
    color: "#fff",
    padding: "5px 8px",
    fontSize: "var(--font-size-tiny)",
    fontWeight: 600,
    textAlign: "center",
    whiteSpace: "nowrap",
  }
  const tdBase: React.CSSProperties = {
    padding: "4px 8px",
    fontSize: "var(--font-size-tiny)",
    textAlign: "center",
    borderBottom: "0.5px solid var(--color-border)",
    verticalAlign: "middle",
  }
  const thStyle = (extra?: React.CSSProperties): React.CSSProperties =>
    ({ ...thBase, background: "var(--color-mid)", ...extra })
  const tdStyle = (extra?: React.CSSProperties): React.CSSProperties =>
    ({ ...tdBase, ...extra })

  const params2 = new URLSearchParams()
  if (range) params2.set("range", range)
  if (from) params2.set("from", from)
  if (to) params2.set("to", to)
  const qs = params2.toString()

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
            href={`/statistics${qs ? `?${qs}` : ""}`}
            style={{
              color: "var(--color-gold)",
              fontSize: "var(--font-size-tiny)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              textDecoration: "none",
            }}
          >
            ← Statystyki
          </Link>
          <span
            style={{
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-muted)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            {setup.name || "Setup"}
          </span>
        </div>
      </header>

      <main
        className="mx-auto px-4 py-6 flex flex-col gap-6"
        style={{ maxWidth: "var(--content-max-width)" }}
      >
        <Suspense>
          <StatisticsFilter />
        </Suspense>

        {trades.length === 0 ? (
          <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
            Brak transakcji w wybranym okresie.
          </p>
        ) : (
          <>
            {/* Global summary for this setup */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {[
                { label: "Transakcji",    value: String(global.trades),       color: "var(--color-text)" },
                { label: "Win Rate",      value: pct(global.winRate),         color: global.winRate !== null ? (global.winRate >= 0.5 ? "#2D8C4E" : "#D96060") : "var(--color-text)" },
                { label: "Avg R",         value: global.avgR !== null ? global.avgR.toFixed(2) : "—", color: global.avgR !== null ? (global.avgR > 0 ? "#2D8C4E" : global.avgR < 0 ? "#D96060" : "var(--color-text)") : "var(--color-text)" },
                { label: "P&L ($)",       value: global.totalPnL !== 0 ? (global.totalPnL > 0 ? "+" : "") + global.totalPnL.toFixed(2) : "0.00", color: global.totalPnL > 0 ? "#2D8C4E" : global.totalPnL < 0 ? "#D96060" : "var(--color-text)" },
                { label: "Profit Factor", value: pf(global.profitFactor),     color: typeof global.profitFactor === "number" && global.profitFactor >= 1.5 ? "#2D8C4E" : "var(--color-text)" },
              ].map(({ label, value, color }) => (
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
                  <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--color-muted)",
                      marginTop: 2,
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Per-trigger table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
                <thead>
                  <tr>
                    <th style={thStyle({ textAlign: "left" })}>Trigger</th>
                    <th style={thStyle({ width: 60 })}>Trades</th>
                    <th style={thStyle({ width: 72 })}>Win Rate</th>
                    <th style={thStyle({ width: 60 })}>Avg R</th>
                    <th style={thStyle({ width: 80 })}>P&amp;L ($)</th>
                    <th style={thStyle({ width: 76 })}>P. Factor</th>
                    <th style={thStyle({ width: 48 })}>Long</th>
                    <th style={thStyle({ width: 48 })}>Short</th>
                    <th style={thStyle({ width: 48 })}>Tier A</th>
                    <th style={thStyle({ width: 48 })}>Tier B</th>
                    <th style={thStyle({ width: 48 })}>Tier C</th>
                  </tr>
                </thead>
                <tbody>
                  {triggerStats.map((s) => (
                    <tr
                      key={s.triggerId ?? "__none__"}
                      style={{
                        background:
                          s.triggerId === null ? "var(--color-light)" : "var(--color-white)",
                      }}
                    >
                      <td
                        style={tdStyle({
                          textAlign: "left",
                          fontWeight: s.triggerId === null ? 400 : 600,
                          color:
                            s.triggerId === null
                              ? "var(--color-muted)"
                              : "var(--color-text)",
                        })}
                      >
                        {s.triggerName}
                      </td>
                      <td style={tdStyle()}>{s.trades}</td>
                      <td
                        style={tdStyle({
                          color:
                            s.winRate !== null
                              ? s.winRate >= 0.5
                                ? "#2D8C4E"
                                : "#D96060"
                              : "var(--color-muted)",
                        })}
                      >
                        {pct(s.winRate)}
                      </td>
                      <td
                        style={tdStyle({
                          color:
                            s.avgR !== null
                              ? s.avgR > 0
                                ? "#2D8C4E"
                                : s.avgR < 0
                                ? "#D96060"
                                : undefined
                              : "var(--color-muted)",
                        })}
                      >
                        {s.avgR !== null ? s.avgR.toFixed(2) : "—"}
                      </td>
                      <td
                        style={tdStyle({
                          color:
                            s.totalPnL > 0
                              ? "#2D8C4E"
                              : s.totalPnL < 0
                              ? "#D96060"
                              : undefined,
                        })}
                      >
                        {s.totalPnL > 0 ? "+" : ""}
                        {s.totalPnL.toFixed(2)}
                      </td>
                      <td style={tdStyle()}>{pf(s.profitFactor)}</td>
                      <td style={tdStyle()}>{s.long || "—"}</td>
                      <td style={tdStyle()}>{s.short || "—"}</td>
                      <td style={tdStyle()}>{s.tierA || "—"}</td>
                      <td style={tdStyle()}>{s.tierB || "—"}</td>
                      <td style={tdStyle()}>{s.tierC || "—"}</td>
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/statistics/setup/[setupId]/page.tsx"
git commit -m "feat: add statistics setup drill-down page with per-trigger metrics"
```

---

## Task 8: Make Setup Rows Clickable on Statistics Page

**Files:**
- Modify: `app/(app)/statistics/page.tsx`

- [ ] **Step 1: Build query string for links**

In `StatisticsPage`, after `const { range, from, to } = await searchParams`, add:

```typescript
const linkParams = new URLSearchParams()
if (range) linkParams.set("range", range)
if (from) linkParams.set("from", from)
if (to) linkParams.set("to", to)
const qs = linkParams.toString()
```

- [ ] **Step 2: Update setup name cell to be a link**

In the per-setup table `<tbody>`, find the first `<td>` in each row (the setup name cell):

```typescript
// Before:
<td style={tdStyle("setup", { textAlign: "left", fontWeight: s.setupId === null ? 400 : 600, color: s.setupId === null ? "var(--color-muted)" : "var(--color-text)" })}>
  {s.setupName}
</td>

// After:
<td style={tdStyle("setup", { textAlign: "left", fontWeight: s.setupId === null ? 400 : 600, color: s.setupId === null ? "var(--color-muted)" : "var(--color-text)" })}>
  {s.setupId !== null ? (
    <a
      href={`/statistics/setup/${s.setupId}${qs ? `?${qs}` : ""}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "inherit", textDecoration: "none", display: "block" }}
    >
      {s.setupName}
    </a>
  ) : (
    s.setupName
  )}
</td>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/statistics/page.tsx"
git commit -m "feat: make setup rows clickable links to drill-down page"
```

---

## Self-Review Notes

- Task 1 must complete before all others (schema migration first).
- Task 3 depends on Task 2 (needs the new actions imported).
- Task 4 and 5 are independent of each other but both depend on Task 1 (type from Prisma).
- Task 7 depends on Task 6 (`computeTriggerStats`).
- Task 8 is fully independent (only adds `<a>` tags, no new data).
- `TradeForTriggerStats` extends `TradeForStats` — existing `computeSetupStats` call sites are unaffected.
- The `trigger String?` field on `Trade` is never removed — backward compatibility preserved.
