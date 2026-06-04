# Weekly Review UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Weekly Review wizard UI (11 steps + complete page) with dashboard entry point.

**Architecture:** Mirror the Daily Card wizard pattern — a Next.js server page at `/weekly/[weekStart]/step/[step]` loads data and dispatches to client step components. A shared `WeeklyLayout` wraps all steps. Steps auto-save on "Dalej" via `updateWeeklyReview`. The 16 spec sections are grouped into 11 wizard steps.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma, existing forge components (`SectionHeader`, `TextArea`, `TextInput`, `TableInput`, `BridgeIndicator`), existing actions in `actions/weekly.ts`.

---

## File Map

**New files:**
- `app/(app)/weekly/[weekStart]/step/[step]/page.tsx` — server page, dispatches to step components
- `app/(app)/weekly/[weekStart]/complete/page.tsx` — completion summary
- `components/weekly/WeeklyLayout.tsx` — shell (header, progress bar, nav)
- `components/weekly/steps/WeeklyStep1Stats.tsx` — sekcja 1: statystyki (auto)
- `components/weekly/steps/WeeklyStep2Tiers.tsx` — sekcje 2–3: tier sizing + heatmapa dni
- `components/weekly/steps/WeeklyStep3EdgeTrend.tsx` — sekcja 4: trend edge 4 tygodnie
- `components/weekly/steps/WeeklyStep4Trades.tsx` — sekcje 5–6: najlepszy/najgorszy trade
- `components/weekly/steps/WeeklyStep5Lessons.tsx` — sekcje 7–8: lekcje + wdzięczność
- `components/weekly/steps/WeeklyStep6Patterns.tsx` — sekcje 9–10: wzorce + błędy
- `components/weekly/steps/WeeklyStep7Mental.tsx` — sekcja 11: mental capital
- `components/weekly/steps/WeeklyStep8Identity.tsx` — sekcje 12–13: tożsamość + zagrożenia
- `components/weekly/steps/WeeklyStep9Bridge.tsx` — sekcja 14: Most do Daily (Bridge 2)
- `components/weekly/steps/WeeklyStep10Practice.tsx` — sekcja 15: deliberate practice
- `components/weekly/steps/WeeklyStep11Goal.tsx` — sekcja 16: cel + mentor + stop-loss
- `components/dashboard/WeeklyAction.tsx` — przycisk CTA tygodniowego przeglądu

**Modified files:**
- `actions/weekly.ts` — dodaj `getEdgeTrend`
- `app/(app)/dashboard/page.tsx` — dodaj `WeeklyAction`

---

## Step groupings (spec sections → wizard steps)

| Krok | Sekcje spec | Tytuł |
|------|-------------|-------|
| 1 | 1 | Statystyki tygodnia (auto) |
| 2 | 2–3 | Tier sizing + Heatmapa dni |
| 3 | 4 | Trend edge (4 tygodnie) |
| 4 | 5–6 | Najlepszy / najgorszy trade |
| 5 | 7–8 | Trzy lekcje + Wdzięczność |
| 6 | 9–10 | Wzorce + Powtarzające się błędy |
| 7 | 11 | Mental capital |
| 8 | 12–13 | Identity check + Mapa zagrożeń |
| 9 | 14 | Most do Daily (Bridge 2) |
| 10 | 15 | Deliberate practice |
| 11 | 16 | Cel + Mentor + Stop-loss |

---

## Task 1: WeeklyLayout + routing skeleton

**Files:**
- Create: `components/weekly/WeeklyLayout.tsx`
- Create: `app/(app)/weekly/[weekStart]/step/[step]/page.tsx`

- [ ] **Step 1: Create WeeklyLayout**

```tsx
// components/weekly/WeeklyLayout.tsx
import Link from "next/link"

interface WeeklyLayoutProps {
  children: React.ReactNode
  weekStart: string
  currentStep: number
  totalSteps: number
  stepLabel: string
  nextHref?: string
  prevHref?: string
  nextLabel?: string
  onNext?: () => void
  nextDisabled?: boolean
  lastWeekGoalRecap?: string | null
}

const TOTAL_STEPS = 11

export function WeeklyLayout({
  children,
  weekStart,
  currentStep,
  stepLabel,
  nextHref,
  prevHref,
  nextLabel = "Dalej →",
  nextDisabled = false,
  lastWeekGoalRecap,
}: WeeklyLayoutProps) {
  const progressPercent = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div
        className="sticky top-0 z-10 border-b"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div className="mx-auto px-4 py-2" style={{ maxWidth: "var(--content-max-width)" }}>
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="font-bold uppercase tracking-wider"
                style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-gold)", textDecoration: "none" }}
              >
                The Forge
              </Link>
              <span className="ml-2" style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
                Przegląd tygodniowy · {weekStart}
              </span>
            </div>
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
              Krok {currentStep} z {TOTAL_STEPS}
            </span>
          </div>
          <div className="mt-2 rounded-full overflow-hidden" style={{ height: 3, background: "var(--color-border)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%`, background: "var(--color-gold)" }}
            />
          </div>
          <p className="mt-1" style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
            {stepLabel}
          </p>
        </div>
        {lastWeekGoalRecap && (
          <div style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-light)", padding: "6px 16px" }}>
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.3px", marginRight: "8px" }}>
              Cel z poprz. tygodnia:
            </span>
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text)" }}>
              {lastWeekGoalRecap}
            </span>
          </div>
        )}
      </div>

      <div className="mx-auto px-4 py-6" style={{ maxWidth: "var(--content-max-width)" }}>
        {children}
      </div>

      <div className="sticky bottom-0 border-t" style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}>
        <div className="mx-auto px-4 py-3 flex items-center justify-between" style={{ maxWidth: "var(--content-max-width)" }}>
          {prevHref ? (
            <Link href={prevHref} className="text-sm" style={{ color: "var(--color-muted)" }}>← Wstecz</Link>
          ) : (
            <span />
          )}
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

- [ ] **Step 2: Create server page skeleton**

```tsx
// app/(app)/weekly/[weekStart]/step/[step]/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getOrCreateWeeklyReview, getWeeklyStats } from "@/actions/weekly"
import { WeeklyStep1Stats } from "@/components/weekly/steps/WeeklyStep1Stats"
import { WeeklyStep2Tiers } from "@/components/weekly/steps/WeeklyStep2Tiers"
import { WeeklyStep3EdgeTrend } from "@/components/weekly/steps/WeeklyStep3EdgeTrend"
import { WeeklyStep4Trades } from "@/components/weekly/steps/WeeklyStep4Trades"
import { WeeklyStep5Lessons } from "@/components/weekly/steps/WeeklyStep5Lessons"
import { WeeklyStep6Patterns } from "@/components/weekly/steps/WeeklyStep6Patterns"
import { WeeklyStep7Mental } from "@/components/weekly/steps/WeeklyStep7Mental"
import { WeeklyStep8Identity } from "@/components/weekly/steps/WeeklyStep8Identity"
import { WeeklyStep9Bridge } from "@/components/weekly/steps/WeeklyStep9Bridge"
import { WeeklyStep10Practice } from "@/components/weekly/steps/WeeklyStep10Practice"
import { WeeklyStep11Goal } from "@/components/weekly/steps/WeeklyStep11Goal"

const TOTAL_STEPS = 11

export default async function WeeklyStepPage({
  params,
}: {
  params: Promise<{ weekStart: string; step: string }>
}) {
  const { weekStart, step: stepStr } = await params
  const step = parseInt(stepStr)
  if (isNaN(step) || step < 1 || step > TOTAL_STEPS) {
    redirect(`/weekly/${weekStart}/step/1`)
  }

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [review, stats] = await Promise.all([
    getOrCreateWeeklyReview(weekStart),
    getWeeklyStats(weekStart),
  ])

  const props = { review, stats, weekStart, step }

  if (step === 1) return <WeeklyStep1Stats {...props} />
  if (step === 2) return <WeeklyStep2Tiers {...props} />
  if (step === 3) return <WeeklyStep3EdgeTrend {...props} />
  if (step === 4) return <WeeklyStep4Trades {...props} />
  if (step === 5) return <WeeklyStep5Lessons {...props} />
  if (step === 6) return <WeeklyStep6Patterns {...props} />
  if (step === 7) return <WeeklyStep7Mental {...props} />
  if (step === 8) return <WeeklyStep8Identity {...props} />
  if (step === 9) return <WeeklyStep9Bridge {...props} />
  if (step === 10) return <WeeklyStep10Practice {...props} />
  return <WeeklyStep11Goal {...props} />
}
```

- [ ] **Step 3: Create placeholder components so the page compiles**

Create each of these files with a minimal placeholder (replace one by one in Tasks 2–12):

```tsx
// components/weekly/steps/WeeklyStep1Stats.tsx
"use client"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

export function WeeklyStep1Stats({ review, weekStart, step }: Props) {
  return (
    <WeeklyLayout weekStart={weekStart} currentStep={step} totalSteps={11} stepLabel="Statystyki"
      prevHref="/dashboard" nextHref={`/weekly/${weekStart}/step/2`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}>
      <p style={{ color: "var(--color-muted)" }}>— wkrótce —</p>
    </WeeklyLayout>
  )
}
```

Repeat the same stub pattern for `WeeklyStep2Tiers` through `WeeklyStep11Goal`, adjusting `stepLabel`, `prevHref` (previous step), and `nextHref` (next step). Step 11 `nextHref` = `/weekly/${weekStart}/complete`.

- [ ] **Step 4: Verify the app builds**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/weekly/ app/(app)/weekly/
git commit -m "feat: add weekly review routing skeleton and WeeklyLayout"
```

---

## Task 2: Step 1 — Statystyki tygodnia

**Files:**
- Modify: `components/weekly/steps/WeeklyStep1Stats.tsx`

- [ ] **Step 1: Implement stats table**

```tsx
"use client"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, BridgeIndicator } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"
import { useState } from "react"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

function fmt(n: number, decimals = 2) {
  return n === 0 ? "—" : n.toFixed(decimals)
}

function pct(n: number) {
  return n === 0 ? "—" : `${(n * 100).toFixed(0)}%`
}

export function WeeklyStep1Stats({ review, stats, weekStart, step }: Props) {
  const [maxDrawdown, setMaxDrawdown] = useState(review.maxDrawdown ?? "")
  const [netPL, setNetPL] = useState(review.netPL ?? "")

  async function handleSave(field: "maxDrawdown" | "netPL", value: string) {
    await updateWeeklyReview(review.id, { [field]: value || undefined })
  }

  return (
    <WeeklyLayout weekStart={weekStart} currentStep={step} totalSteps={11}
      stepLabel="Statystyki tygodnia"
      prevHref="/dashboard"
      nextHref={`/weekly/${weekStart}/step/2`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}>
      <div className="flex flex-col gap-4">
        <SectionHeader number="1" title="STATYSTYKI TYGODNIA" />
        <BridgeIndicator source="z kart dziennych" />

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--font-size-tiny)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--color-muted)" }}></th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Tradów</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Win%</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Avg R</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>PF</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Best R</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Worst R</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Max DD</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Net P&L</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Sen (h)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "6px 8px", fontWeight: 600, color: "var(--color-text)" }}>Ten tydzień</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{stats.trades}</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{pct(stats.winRate)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{fmt(stats.avgR)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{fmt(stats.profitFactor)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{fmt(stats.bestR)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{fmt(stats.worstR)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>
                  <input
                    value={maxDrawdown}
                    onChange={e => setMaxDrawdown(e.target.value)}
                    onBlur={() => handleSave("maxDrawdown", maxDrawdown)}
                    placeholder="—"
                    style={{ width: 60, textAlign: "center", border: "none", background: "transparent", fontSize: "var(--font-size-tiny)", color: "var(--color-text)" }}
                  />
                </td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>
                  <input
                    value={netPL}
                    onChange={e => setNetPL(e.target.value)}
                    onBlur={() => handleSave("netPL", netPL)}
                    placeholder="—"
                    style={{ width: 70, textAlign: "center", border: "none", background: "transparent", fontSize: "var(--font-size-tiny)", color: "var(--color-text)" }}
                  />
                </td>
                <td style={{ padding: "6px 8px", textAlign: "center" }}>{fmt(stats.sleepAvg, 1)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", fontStyle: "italic" }}>
          Max DD i Net P&L wpisz ręcznie (z platformy brokerskiej).
        </p>
      </div>
    </WeeklyLayout>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/weekly/steps/WeeklyStep1Stats.tsx
git commit -m "feat: weekly step 1 — stats table with auto-calculated values"
```

---

## Task 3: Step 2 — Tier sizing + Heatmapa dni

**Files:**
- Modify: `components/weekly/steps/WeeklyStep2Tiers.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client"
import { useState } from "react"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, TextInput, BridgeIndicator } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

function pct(n: number) { return n === 0 ? "—" : `${(n * 100).toFixed(0)}%` }
function fmt(n: number) { return n === 0 ? "—" : n.toFixed(2) }

const DAYS = [
  { key: "mon" as const, label: "Poniedziałek" },
  { key: "tue" as const, label: "Wtorek" },
  { key: "wed" as const, label: "Środa" },
  { key: "thu" as const, label: "Czwartek" },
  { key: "fri" as const, label: "Piątek" },
]

export function WeeklyStep2Tiers({ review, stats, weekStart, step }: Props) {
  const [tierA, setTierA] = useState(review.tierAConclusion ?? "")
  const [tierB, setTierB] = useState(review.tierBConclusion ?? "")
  const [tierC, setTierC] = useState(review.tierCConclusion ?? "")
  const [obs, setObs] = useState({
    mon: review.monObservation ?? "",
    tue: review.tueObservation ?? "",
    wed: review.wedObservation ?? "",
    thu: review.thuObservation ?? "",
    fri: review.friObservation ?? "",
  })

  async function saveTier(field: "tierAConclusion" | "tierBConclusion" | "tierCConclusion", value: string) {
    await updateWeeklyReview(review.id, { [field]: value || undefined })
  }

  async function saveObs(day: keyof typeof obs, value: string) {
    const fieldMap = { mon: "monObservation", tue: "tueObservation", wed: "wedObservation", thu: "thuObservation", fri: "friObservation" } as const
    await updateWeeklyReview(review.id, { [fieldMap[day]]: value || undefined })
  }

  const tiers = [
    { label: "A-setup (100%)", data: stats.byTier.A, conclusion: tierA, setConclusion: setTierA, field: "tierAConclusion" as const },
    { label: "B-setup (50%)", data: stats.byTier.B, conclusion: tierB, setConclusion: setTierB, field: "tierBConclusion" as const },
    { label: "C-setup (25%)", data: stats.byTier.C, conclusion: tierC, setConclusion: setTierC, field: "tierCConclusion" as const },
  ]

  return (
    <WeeklyLayout weekStart={weekStart} currentStep={step} totalSteps={11}
      stepLabel="Tier sizing + Heatmapa"
      prevHref={`/weekly/${weekStart}/step/1`}
      nextHref={`/weekly/${weekStart}/step/3`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}>
      <div className="flex flex-col gap-6">

        {/* Section 2: Tier sizing */}
        <div>
          <SectionHeader number="2" title="TIER SIZING — CO NAPRAWDĘ DZIAŁA?" />
          <BridgeIndicator source="z kart dziennych" />
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--font-size-tiny)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--color-muted)" }}>Setup</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Tradów</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Win%</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Avg R</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Net R</th>
                  <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--color-muted)" }}>Wniosek</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map(({ label, data, conclusion, setConclusion, field }) => (
                  <tr key={label} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "6px 8px", fontWeight: 600 }}>{label}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>{data.trades}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>{pct(data.winRate)}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>{fmt(data.avgR)}</td>
                    <td style={{ padding: "6px 8px", textAlign: "center" }}>{fmt(data.netR)}</td>
                    <td style={{ padding: "6px 8px" }}>
                      <input
                        value={conclusion}
                        onChange={e => setConclusion(e.target.value)}
                        onBlur={() => saveTier(field, conclusion)}
                        placeholder="zwiększyć / zmniejszyć / bez zmian"
                        style={{ width: "100%", border: "none", borderBottom: "1px solid var(--color-border)", background: "transparent", fontSize: "var(--font-size-tiny)", padding: "2px 0" }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Day heatmap */}
        <div>
          <SectionHeader number="3" title="DNI TYGODNIA — HEATMAPA PROCESU" />
          <BridgeIndicator source="z kart dziennych" />
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--font-size-tiny)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--color-muted)" }}>Dzień</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Proces</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>P&L (R)</th>
                  <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Mental</th>
                  <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--color-muted)" }}>Obserwacja</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map(({ key, label }) => {
                  const d = stats.byDay[key]
                  return (
                    <tr key={key} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "6px 8px", fontWeight: 600 }}>{label}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>{d.processScore ?? "—"}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>{d.pl ?? "—"}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>{d.mentalAfter ?? "—"}</td>
                      <td style={{ padding: "6px 8px" }}>
                        <input
                          value={obs[key]}
                          onChange={e => setObs(prev => ({ ...prev, [key]: e.target.value }))}
                          onBlur={() => saveObs(key, obs[key])}
                          placeholder="najważniejsza obserwacja"
                          style={{ width: "100%", border: "none", borderBottom: "1px solid var(--color-border)", background: "transparent", fontSize: "var(--font-size-tiny)", padding: "2px 0" }}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </WeeklyLayout>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/weekly/steps/WeeklyStep2Tiers.tsx
git commit -m "feat: weekly step 2 — tier sizing + day heatmap"
```

---

## Task 4: Step 3 — Edge trend (4 tygodnie) + nowa akcja

**Files:**
- Modify: `actions/weekly.ts` — add `getEdgeTrend`
- Modify: `components/weekly/steps/WeeklyStep3EdgeTrend.tsx`
- Modify: `app/(app)/weekly/[weekStart]/step/[step]/page.tsx` — pass edgeTrend to step 3

- [ ] **Step 1: Add `getEdgeTrend` to `actions/weekly.ts`**

Add at end of file:

```ts
export interface EdgeWeekData {
  label: string
  winRate: number
  avgR: number
  profitFactor: number
}

export async function getEdgeTrend(weekStartStr: string): Promise<EdgeWeekData[]> {
  const userId = await requireUser()
  const currentWeekStart = new Date(weekStartStr)

  // Fetch up to 4 previous weekly reviews before current week
  const previousReviews = await prisma.weeklyReview.findMany({
    where: { userId, weekStart: { lt: currentWeekStart } },
    orderBy: { weekStart: "desc" },
    take: 4,
    select: { weekStart: true, weekEnd: true },
  })

  // Reverse so oldest is first
  const ordered = previousReviews.reverse()

  const results: EdgeWeekData[] = await Promise.all(
    ordered.map(async (r) => {
      const s = await computeWeeklyStats(userId, r.weekStart, r.weekEnd)
      const d = r.weekStart
      return {
        label: `${d.getUTCDate()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
        winRate: s.winRate,
        avgR: s.avgR,
        profitFactor: s.profitFactor,
      }
    })
  )

  return results
}
```

- [ ] **Step 2: Update server page to fetch edge trend for step 3**

In `app/(app)/weekly/[weekStart]/step/[step]/page.tsx`, add import and fetch:

```tsx
import { getOrCreateWeeklyReview, getWeeklyStats, getEdgeTrend } from "@/actions/weekly"
// ...
const [review, stats, edgeTrend] = await Promise.all([
  getOrCreateWeeklyReview(weekStart),
  getWeeklyStats(weekStart),
  step === 3 ? getEdgeTrend(weekStart) : Promise.resolve([]),
])
// ...
// Pass edgeTrend to step 3:
if (step === 3) return <WeeklyStep3EdgeTrend {...props} edgeTrend={edgeTrend} />
// other steps keep { review, stats, weekStart, step } as before
```

- [ ] **Step 3: Implement WeeklyStep3EdgeTrend**

```tsx
"use client"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, BridgeIndicator } from "@/components/forge"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"
import type { EdgeWeekData } from "@/actions/weekly"

interface Props {
  review: WeeklyReview
  stats: WeeklyStats
  weekStart: string
  step: number
  edgeTrend: EdgeWeekData[]
}

function pct(n: number) { return n === 0 ? "—" : `${(n * 100).toFixed(0)}%` }
function fmt(n: number) { return n === 0 ? "—" : n.toFixed(2) }

function trendArrow(data: EdgeWeekData[]): string {
  if (data.length < 2) return "→"
  const last = data[data.length - 1]
  const prev = data[data.length - 2]
  const score = (last.winRate - prev.winRate) + (last.avgR - prev.avgR)
  if (score > 0.05) return "↗"
  if (score < -0.05) return "↘"
  return "→"
}

export function WeeklyStep3EdgeTrend({ review, stats, weekStart, step, edgeTrend }: Props) {
  // Build columns: up to 4 previous weeks + this week
  const allWeeks = [
    ...edgeTrend,
    {
      label: "Ten tydz.",
      winRate: stats.winRate,
      avgR: stats.avgR,
      profitFactor: stats.profitFactor,
    },
  ]

  const rows = [
    { label: "Win rate", getValue: (w: EdgeWeekData) => pct(w.winRate) },
    { label: "Avg R", getValue: (w: EdgeWeekData) => fmt(w.avgR) },
    { label: "Profit factor", getValue: (w: EdgeWeekData) => fmt(w.profitFactor) },
  ]

  return (
    <WeeklyLayout weekStart={weekStart} currentStep={step} totalSteps={11}
      stepLabel="Trend edge"
      prevHref={`/weekly/${weekStart}/step/2`}
      nextHref={`/weekly/${weekStart}/step/4`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}>
      <div className="flex flex-col gap-4">
        <SectionHeader number="4" title="TREND EDGE — 4 OSTATNIE TYGODNIE" />
        <BridgeIndicator source="z poprzednich Weekly Review" />

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--font-size-tiny)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--color-muted)" }}></th>
                {allWeeks.map((w, i) => (
                  <th key={i} style={{ padding: "4px 8px", color: i === allWeeks.length - 1 ? "var(--color-text)" : "var(--color-muted)", fontWeight: i === allWeeks.length - 1 ? 700 : 400 }}>
                    {w.label}
                  </th>
                ))}
                <th style={{ padding: "4px 8px", color: "var(--color-muted)" }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ label, getValue }) => (
                <tr key={label} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "6px 8px", fontWeight: 600 }}>{label}</td>
                  {allWeeks.map((w, i) => (
                    <td key={i} style={{ padding: "6px 8px", textAlign: "center" }}>{getValue(w as EdgeWeekData)}</td>
                  ))}
                  <td style={{ padding: "6px 8px", textAlign: "center", fontSize: 16 }}>{trendArrow(edgeTrend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", fontStyle: "italic" }}>
          Cztery złe tygodnie z rzędu = sygnał do rewizji systemu.
        </p>
      </div>
    </WeeklyLayout>
  )
}
```

- [ ] **Step 4: Typecheck + commit**

```bash
npx tsc --noEmit
git add actions/weekly.ts components/weekly/steps/WeeklyStep3EdgeTrend.tsx app/(app)/weekly/
git commit -m "feat: weekly step 3 — edge trend table + getEdgeTrend action"
```

---

## Task 5: Step 4 — Najlepszy / najgorszy trade

**Files:**
- Modify: `components/weekly/steps/WeeklyStep4Trades.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client"
import { useState } from "react"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, TextArea } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

export function WeeklyStep4Trades({ review, weekStart, step }: Props) {
  const [best, setBest] = useState(review.bestTradeWhy ?? "")
  const [worst, setWorst] = useState(review.worstTradeWhatWentWrong ?? "")

  async function handleNext() {
    await updateWeeklyReview(review.id, {
      bestTradeWhy: best || undefined,
      worstTradeWhatWentWrong: worst || undefined,
    })
  }

  return (
    <WeeklyLayout weekStart={weekStart} currentStep={step} totalSteps={11}
      stepLabel="Najlepszy i najgorszy trade"
      prevHref={`/weekly/${weekStart}/step/3`}
      nextHref={`/weekly/${weekStart}/step/5`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}>
      <div className="flex flex-col gap-6">
        <div>
          <SectionHeader number="5" title="NAJLEPSZY TRADE TYGODNIA — DLACZEGO ZADZIAŁAŁ?" />
          <TextArea
            label="Powodzenie nie dlatego, że zarobił — ale dlatego, że zachowałem się zgodnie z planem. Co konkretnie?"
            value={best}
            onChange={setBest}
            onBlur={() => updateWeeklyReview(review.id, { bestTradeWhy: best || undefined })}
            rows={6}
          />
        </div>
        <div>
          <SectionHeader number="6" title="NAJGORSZY TRADE TYGODNIA — CO POSZŁO NIE TAK?" />
          <TextArea
            label="Nie chodzi o stratę. Chodzi o decyzję. Co dokładnie zrobiłem źle — i co czułem, zanim to zrobiłem?"
            value={worst}
            onChange={setWorst}
            onBlur={() => updateWeeklyReview(review.id, { worstTradeWhatWentWrong: worst || undefined })}
            rows={6}
          />
        </div>
      </div>
    </WeeklyLayout>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/weekly/steps/WeeklyStep4Trades.tsx
git commit -m "feat: weekly step 4 — best/worst trade analysis"
```

---

## Task 6: Step 5 — Trzy lekcje + Wdzięczność

**Files:**
- Modify: `components/weekly/steps/WeeklyStep5Lessons.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client"
import { useState } from "react"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, TextArea, TextInput } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

export function WeeklyStep5Lessons({ review, weekStart, step }: Props) {
  const [l1, setL1] = useState(review.lesson1 ?? "")
  const [l2, setL2] = useState(review.lesson2 ?? "")
  const [l3, setL3] = useState(review.lesson3 ?? "")
  const [gratitude, setGratitude] = useState(review.gratitude ?? "")

  async function saveField(field: "lesson1" | "lesson2" | "lesson3" | "gratitude", value: string) {
    await updateWeeklyReview(review.id, { [field]: value || undefined })
  }

  return (
    <WeeklyLayout weekStart={weekStart} currentStep={step} totalSteps={11}
      stepLabel="Trzy lekcje + wdzięczność"
      prevHref={`/weekly/${weekStart}/step/4`}
      nextHref={`/weekly/${weekStart}/step/6`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}>
      <div className="flex flex-col gap-6">
        <div>
          <SectionHeader number="7" title="TRZY KONKRETNE LEKCJE Z TYGODNIA" />
          <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", marginBottom: 12, fontStyle: "italic" }}>
            Nie ogólniki. Konkretne, transferowalne wnioski które zabierasz w przyszły tydzień:
          </p>
          <div className="flex flex-col gap-3">
            {([
              { n: 1, val: l1, set: setL1, field: "lesson1" as const },
              { n: 2, val: l2, set: setL2, field: "lesson2" as const },
              { n: 3, val: l3, set: setL3, field: "lesson3" as const },
            ] as const).map(({ n, val, set, field }) => (
              <div key={n} className="flex gap-2 items-start">
                <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", minWidth: 16, paddingTop: 2 }}>{n}.</span>
                <input
                  value={val}
                  onChange={e => set(e.target.value)}
                  onBlur={() => saveField(field, val)}
                  style={{ flex: 1, border: "none", borderBottom: "1px solid var(--color-border)", background: "transparent", fontSize: "var(--font-size-body)", padding: "4px 0", color: "var(--color-text)" }}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader number="8" title="WDZIĘCZNOŚĆ — POZYTYWNY ANCHOR TYGODNIA" />
          <TextArea
            label="Za co jestem wdzięczny w tym tygodniu (osobiste, niekoniecznie tradingowe):"
            value={gratitude}
            onChange={setGratitude}
            onBlur={() => saveField("gratitude", gratitude)}
            rows={3}
          />
        </div>
      </div>
    </WeeklyLayout>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/weekly/steps/WeeklyStep5Lessons.tsx
git commit -m "feat: weekly step 5 — three lessons + gratitude"
```

---

## Task 7: Step 6 — Pattern analysis + Powtarzające się błędy

**Files:**
- Modify: `components/weekly/steps/WeeklyStep6Patterns.tsx`

Note: `repeatingErrors` is stored as `Json` in Prisma. Shape: `Array<{ error: string; count: number|null; triggerContext: string; costR: number|null; eliminationPlan: string }>`.

- [ ] **Step 1: Implement**

```tsx
"use client"
import { useState } from "react"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, TextArea, TableInput } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface ErrorRow {
  id: string
  error: string
  count: string
  triggerContext: string
  costR: string
  eliminationPlan: string
}

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

const ERROR_COLUMNS = [
  { id: "error",           label: "Błąd",             width: "26%", type: "textarea" as const },
  { id: "count",           label: "Ile razy",          width: "8%",  type: "number" as const },
  { id: "triggerContext",  label: "Trigger / kontekst", width: "28%", type: "textarea" as const },
  { id: "costR",           label: "Koszt (R)",         width: "10%", type: "number" as const },
  { id: "eliminationPlan", label: "Plan eliminacji",   width: "28%", type: "textarea" as const },
]

function makeEmpty(): ErrorRow {
  return { id: crypto.randomUUID(), error: "", count: "", triggerContext: "", costR: "", eliminationPlan: "" }
}

function parseRows(raw: unknown): ErrorRow[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [makeEmpty(), makeEmpty(), makeEmpty(), makeEmpty()]
  }
  return (raw as Record<string, string>[]).map(r => ({ id: crypto.randomUUID(), ...r }))
}

export function WeeklyStep6Patterns({ review, weekStart, step }: Props) {
  const [pattern, setPattern] = useState(review.patternWhenStrongest ?? "")
  const [rows, setRows] = useState<ErrorRow[]>(() => parseRows(review.repeatingErrors))

  async function savePattern(value: string) {
    await updateWeeklyReview(review.id, { patternWhenStrongest: value || undefined })
  }

  async function saveErrors(updatedRows: ErrorRow[]) {
    const data = updatedRows.map(({ id, ...rest }) => rest)
    await updateWeeklyReview(review.id, { repeatingErrors: data })
  }

  function handleAddRow() {
    const newRows = [...rows, makeEmpty()]
    setRows(newRows)
    saveErrors(newRows)
  }

  function handleUpdateRow(index: number, field: string, value: string | number) {
    const newRows = rows.map((r, i) => i === index ? { ...r, [field]: String(value) } : r)
    setRows(newRows)
    saveErrors(newRows)
  }

  return (
    <WeeklyLayout weekStart={weekStart} currentStep={step} totalSteps={11}
      stepLabel="Wzorce + powtarzające się błędy"
      prevHref={`/weekly/${weekStart}/step/5`}
      nextHref={`/weekly/${weekStart}/step/7`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}>
      <div className="flex flex-col gap-6">
        <div>
          <SectionHeader number="9" title="PATTERN ANALYSIS — KIEDY MÓJ EDGE JEST NAJMOCNIEJSZY?" />
          <TextArea
            label="Spójrz na wszystkie wygrywające trade'y. Co je łączy? (rynek, godzina, setup, kontekst makro, mój stan)"
            value={pattern}
            onChange={setPattern}
            onBlur={() => savePattern(pattern)}
            rows={4}
          />
        </div>

        <div>
          <SectionHeader number="10" title="POWTARZAJĄCE SIĘ BŁĘDY (≥2 RAZY W TYM TYGODNIU)" />
          <TableInput
            columns={ERROR_COLUMNS}
            rows={rows}
            onAddRow={handleAddRow}
            onUpdateRow={handleUpdateRow}
            addLabel="+ Dodaj błąd"
            emptyRows={0}
          />
        </div>
      </div>
    </WeeklyLayout>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/weekly/steps/WeeklyStep6Patterns.tsx
git commit -m "feat: weekly step 6 — pattern analysis + repeating errors table"
```

---

## Task 8: Step 7 — Mental capital

**Files:**
- Modify: `components/weekly/steps/WeeklyStep7Mental.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client"
import { useState } from "react"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, TextArea, BridgeIndicator } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

const DAYS_SHORT = ["Pon", "Wt", "Śr", "Czw", "Pt"]

function DotScore({ value }: { value: number | null }) {
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map(n => (
        <div
          key={n}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: value !== null && n <= value ? "var(--color-gold)" : "var(--color-border)",
          }}
        />
      ))}
    </div>
  )
}

export function WeeklyStep7Mental({ review, stats, weekStart, step }: Props) {
  const [renewed, setRenewed] = useState(review.renewedMe ?? "")
  const [drained, setDrained] = useState(review.drainedMe ?? "")

  async function saveField(field: "renewedMe" | "drainedMe", value: string) {
    await updateWeeklyReview(review.id, { [field]: value || undefined })
  }

  return (
    <WeeklyLayout weekStart={weekStart} currentStep={step} totalSteps={11}
      stepLabel="Mental capital"
      prevHref={`/weekly/${weekStart}/step/6`}
      nextHref={`/weekly/${weekStart}/step/8`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}>
      <div className="flex flex-col gap-6">
        <SectionHeader number="11" title="MENTAL CAPITAL — ODNAWIANIE VS WYCZERPYWANIE" />

        {/* Dots per day — auto from daily cards */}
        <div>
          <BridgeIndicator source="z kart dziennych" />
          <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", marginBottom: 8 }}>
            Stan dzień po dniu (mental state wieczorem):
          </p>
          <div className="flex gap-4">
            {DAYS_SHORT.map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-1">
                <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>{day}</span>
                <DotScore value={stats.mentalPerDay[i]} />
                <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text)" }}>
                  {stats.mentalPerDay[i] ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Two column renewal / drain */}
        <div className="flex gap-4">
          <div style={{ flex: 1 }}>
            <TextArea
              label="ODNAWIAŁO mnie (rituals of renewal):"
              value={renewed}
              onChange={setRenewed}
              onBlur={() => saveField("renewedMe", renewed)}
              rows={4}
            />
          </div>
          <div style={{ flex: 1 }}>
            <TextArea
              label="WYCZERPYWAŁO mnie:"
              value={drained}
              onChange={setDrained}
              onBlur={() => saveField("drainedMe", drained)}
              rows={4}
            />
          </div>
        </div>
      </div>
    </WeeklyLayout>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/weekly/steps/WeeklyStep7Mental.tsx
git commit -m "feat: weekly step 7 — mental capital with dot scores"
```

---

## Task 9: Step 8 — Identity check + Mapa zagrożeń

**Files:**
- Modify: `components/weekly/steps/WeeklyStep8Identity.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client"
import { useState } from "react"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, TextArea } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

export function WeeklyStep8Identity({ review, weekStart, step }: Props) {
  const [was, setWas] = useState(review.identityWasThatTrader ?? "")
  const [wasNot, setWasNot] = useState(review.identityWasNot ?? "")
  const [threats, setThreats] = useState(review.threatsMap ?? "")

  async function save(field: "identityWasThatTrader" | "identityWasNot" | "threatsMap", value: string) {
    await updateWeeklyReview(review.id, { [field]: value || undefined })
  }

  return (
    <WeeklyLayout weekStart={weekStart} currentStep={step} totalSteps={11}
      stepLabel="Identity + mapa zagrożeń"
      prevHref={`/weekly/${weekStart}/step/7`}
      nextHref={`/weekly/${weekStart}/step/9`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}>
      <div className="flex flex-col gap-6">
        <div>
          <SectionHeader number="12" title="IDENTITY CHECK" />
          <div className="flex flex-col gap-4">
            <TextArea
              label="Konkretne sytuacje, w których ZACHOWAŁEM SIĘ jak ten trader:"
              value={was}
              onChange={setWas}
              onBlur={() => save("identityWasThatTrader", was)}
              rows={3}
            />
            <TextArea
              label="Sytuacje, w których NIE zachowałem się jak ten trader:"
              value={wasNot}
              onChange={setWasNot}
              onBlur={() => save("identityWasNot", wasNot)}
              rows={3}
            />
          </div>
        </div>

        <div>
          <SectionHeader number="13" title="MAPA ZAGROŻEŃ PRZYSZŁEGO TYGODNIA (PRE-MORTEM)" />
          <TextArea
            label="Wydarzenia makro / kalendarzowe pułapki / osobiste obciążenia. Gdzie najprawdopodobniej zrobię błąd — i jak się obronić?"
            value={threats}
            onChange={setThreats}
            onBlur={() => save("threatsMap", threats)}
            rows={4}
          />
        </div>
      </div>
    </WeeklyLayout>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/weekly/steps/WeeklyStep8Identity.tsx
git commit -m "feat: weekly step 8 — identity check + threats map"
```

---

## Task 10: Step 9 — Most do Daily (Bridge 2)

**Files:**
- Modify: `components/weekly/steps/WeeklyStep9Bridge.tsx`

This is the critical Bridge 2: `bridgeStrategicTopic` feeds into `lastWeekLesson` on Daily Cards; `bridgePreMortemItems` feeds into `preMortem` suggestions.

- [ ] **Step 1: Implement**

```tsx
"use client"
import { useState } from "react"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, TextArea } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

export function WeeklyStep9Bridge({ review, weekStart, step }: Props) {
  const [topic, setTopic] = useState(review.bridgeStrategicTopic ?? "")
  const rawItems = Array.isArray(review.bridgePreMortemItems) ? review.bridgePreMortemItems as string[] : ["", "", ""]
  const [items, setItems] = useState<string[]>([rawItems[0] ?? "", rawItems[1] ?? "", rawItems[2] ?? ""])

  async function saveTopic(value: string) {
    await updateWeeklyReview(review.id, { bridgeStrategicTopic: value || undefined })
  }

  async function saveItems(updated: string[]) {
    await updateWeeklyReview(review.id, { bridgePreMortemItems: updated })
  }

  function handleItemChange(i: number, value: string) {
    const updated = items.map((v, idx) => idx === i ? value : v)
    setItems(updated)
  }

  function handleItemBlur() {
    saveItems(items)
  }

  return (
    <WeeklyLayout weekStart={weekStart} currentStep={step} totalSteps={11}
      stepLabel="Most do Daily (Bridge 2)"
      prevHref={`/weekly/${weekStart}/step/8`}
      nextHref={`/weekly/${weekStart}/step/10`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}>
      <div className="flex flex-col gap-6">
        <SectionHeader number="14" title="MOST DO DAILY — CO PRZENOSZĘ DO NASTĘPNEGO TYGODNIA" />

        <div
          style={{ padding: "8px 12px", borderLeft: "3px solid var(--color-gold)", background: "var(--color-light)", fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
        >
          To jest Bridge 2: temat strategiczny pojawi się w nagłówku Daily Card przez cały następny tydzień. Konkrety trafią do pre-mortem każdego ranka.
        </div>

        <TextArea
          label="Jeden temat do pogłębienia (strategiczny focus tygodnia):"
          value={topic}
          onChange={setTopic}
          onBlur={() => saveTopic(topic)}
          rows={2}
        />

        <div>
          <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.3px" }}>
            Konkrety do pre-mortem w każdej Daily Card (2-3 błędy/wzorce z sekcji 10):
          </p>
          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", minWidth: 16, paddingTop: 2 }}>{i + 1}.</span>
                <input
                  value={item}
                  onChange={e => handleItemChange(i, e.target.value)}
                  onBlur={handleItemBlur}
                  style={{ flex: 1, border: "none", borderBottom: "1px solid var(--color-border)", background: "transparent", fontSize: "var(--font-size-body)", padding: "4px 0" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </WeeklyLayout>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/weekly/steps/WeeklyStep9Bridge.tsx
git commit -m "feat: weekly step 9 — Bridge 2 (strategic topic + pre-mortem items)"
```

---

## Task 11: Step 10 — Deliberate practice

**Files:**
- Modify: `components/weekly/steps/WeeklyStep10Practice.tsx`

`practicePlan` shape: `Array<{ priority: string; task: string; when: string; howMeasure: string }>` (3 rows).

- [ ] **Step 1: Implement**

```tsx
"use client"
import { useState } from "react"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, TextInput } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface PracticeRow { priority: string; task: string; when: string; howMeasure: string }
interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

function parsePlan(raw: unknown): PracticeRow[] {
  const empty: PracticeRow = { priority: "", task: "", when: "", howMeasure: "" }
  if (!Array.isArray(raw)) return [empty, empty, empty]
  const rows = (raw as Partial<PracticeRow>[]).map(r => ({ priority: r.priority ?? "", task: r.task ?? "", when: r.when ?? "", howMeasure: r.howMeasure ?? "" }))
  while (rows.length < 3) rows.push(empty)
  return rows.slice(0, 3)
}

export function WeeklyStep10Practice({ review, weekStart, step }: Props) {
  const [count, setCount] = useState<string>(review.lastWeekPracticeCount?.toString() ?? "")
  const [whatWentWrong, setWhatWentWrong] = useState(review.lastWeekPracticeWhatWentWrong ?? "")
  const [plan, setPlan] = useState<PracticeRow[]>(() => parsePlan(review.practicePlan))
  const [meta, setMeta] = useState(review.practiceMeta ?? "")

  async function saveHeader() {
    const c = parseInt(count)
    await updateWeeklyReview(review.id, {
      lastWeekPracticeCount: isNaN(c) ? undefined : c,
      lastWeekPracticeWhatWentWrong: whatWentWrong || undefined,
    })
  }

  async function savePlan(updated: PracticeRow[]) {
    await updateWeeklyReview(review.id, { practicePlan: updated })
  }

  function updateRow(i: number, field: keyof PracticeRow, value: string) {
    const updated = plan.map((r, idx) => idx === i ? { ...r, [field]: value } : r)
    setPlan(updated)
    savePlan(updated)
  }

  const PRIORITIES = ["", "MUST", "SHOULD"]

  return (
    <WeeklyLayout weekStart={weekStart} currentStep={step} totalSteps={11}
      stepLabel="Deliberate practice"
      prevHref={`/weekly/${weekStart}/step/9`}
      nextHref={`/weekly/${weekStart}/step/11`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}>
      <div className="flex flex-col gap-6">
        <SectionHeader number="15" title="DELIBERATE PRACTICE — ROZLICZENIE + PLAN" />

        {/* Last week recap */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>
              Plan z poprzedniego tygodnia: zrealizowano
            </span>
            <select
              value={count}
              onChange={e => setCount(e.target.value)}
              onBlur={saveHeader}
              style={{ border: "1px solid var(--color-border)", borderRadius: 4, padding: "2px 4px", fontSize: "var(--font-size-tiny)" }}
            >
              <option value="">—</option>
              {[0, 1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>z 3 zadań.</span>
          </div>
          <TextInput
            label="Co poszło nie tak?"
            value={whatWentWrong}
            onChange={setWhatWentWrong}
            onBlur={saveHeader}
          />
        </div>

        {/* Practice plan table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--font-size-tiny)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", width: "10%" }}>Priorytet</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", width: "40%", textAlign: "left" }}>Zadanie</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", width: "20%", textAlign: "left" }}>Kiedy?</th>
                <th style={{ padding: "4px 8px", color: "var(--color-muted)", width: "30%", textAlign: "left" }}>Jak zmierzę?</th>
              </tr>
            </thead>
            <tbody>
              {plan.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    <select
                      value={row.priority}
                      onChange={e => updateRow(i, "priority", e.target.value)}
                      style={{ border: "1px solid var(--color-border)", borderRadius: 4, padding: "2px 4px", fontSize: "var(--font-size-tiny)", background: row.priority === "MUST" ? "var(--color-gold)" : "transparent", color: row.priority === "MUST" ? "var(--color-white)" : "var(--color-text)" }}
                    >
                      {PRIORITIES.map(p => <option key={p} value={p}>{p || "—"}</option>)}
                    </select>
                  </td>
                  {(["task", "when", "howMeasure"] as const).map(field => (
                    <td key={field} style={{ padding: "6px 8px" }}>
                      <input
                        value={row[field]}
                        onChange={e => updateRow(i, field, e.target.value)}
                        style={{ width: "100%", border: "none", borderBottom: "1px solid var(--color-border)", background: "transparent", fontSize: "var(--font-size-tiny)", padding: "2px 0" }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TextInput
          label="META: czy zaplanowane zadania (poprz. tydzień) były właściwe? Co powinienem był zrobić zamiast?"
          value={meta}
          onChange={setMeta}
          onBlur={() => updateWeeklyReview(review.id, { practiceMeta: meta || undefined })}
        />
      </div>
    </WeeklyLayout>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/weekly/steps/WeeklyStep10Practice.tsx
git commit -m "feat: weekly step 10 — deliberate practice plan"
```

---

## Task 12: Step 11 — Cel + Mentor + Stop-loss

**Files:**
- Modify: `components/weekly/steps/WeeklyStep11Goal.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { WeeklyLayout } from "@/components/weekly/WeeklyLayout"
import { SectionHeader, TextInput } from "@/components/forge"
import { updateWeeklyReview } from "@/actions/weekly"
import type { WeeklyReview } from "@prisma/client"
import type { WeeklyStats } from "@/lib/weekly-stats"

interface Props { review: WeeklyReview; stats: WeeklyStats; weekStart: string; step: number }

export function WeeklyStep11Goal({ review, weekStart, step }: Props) {
  const router = useRouter()
  const [oneSentence, setOneSentence] = useState(review.oneSentenceSummary ?? "")
  const [mentor, setMentor] = useState(review.mentorTopic ?? "")
  const [stopLoss, setStopLoss] = useState(review.stopLossThreshold ?? "")
  const [systemCheck, setSystemCheck] = useState(review.systemCheck ?? "")
  const [goal, setGoal] = useState(review.processGoalNextWeek ?? "")
  const [probability, setProbability] = useState<string>(review.processGoalProbability?.toString() ?? "")
  const [saving, setSaving] = useState(false)

  async function handleFinish() {
    setSaving(true)
    const p = parseInt(probability)
    await updateWeeklyReview(review.id, {
      oneSentenceSummary: oneSentence || undefined,
      mentorTopic: mentor || undefined,
      stopLossThreshold: stopLoss || undefined,
      systemCheck: systemCheck || undefined,
      processGoalNextWeek: goal || undefined,
      processGoalProbability: isNaN(p) ? undefined : p,
      status: "COMPLETED",
    })
    router.push(`/weekly/${weekStart}/complete`)
  }

  return (
    <WeeklyLayout weekStart={weekStart} currentStep={step} totalSteps={11}
      stepLabel="Cel + Mentor + Stop-loss"
      prevHref={`/weekly/${weekStart}/step/10`}
      lastWeekGoalRecap={review.lastWeekGoalRecap}>
      <div className="flex flex-col gap-4">
        <SectionHeader number="16" title="MENTOR · STOP-LOSS · SYSTEM CHECK · CEL" />

        <TextInput label="Jedno zdanie podsumowujące ten tydzień:" value={oneSentence} onChange={setOneSentence} />
        <TextInput label="Top 1 rzecz do omówienia z mentorem / podem:" value={mentor} onChange={setMentor} />
        <TextInput
          label="Mój próg automatycznego stopu (mental state X przez Y dni / strata Z R w tygodniu):"
          value={stopLoss}
          onChange={setStopLoss}
        />
        <TextInput
          label="System check: czy moje narzędzia jeszcze pracują, czy stały się rytuałem? Co zmienić?"
          value={systemCheck}
          onChange={setSystemCheck}
        />

        <div className="flex flex-col gap-2">
          <TextInput
            label="Cel procesowy na przyszły tydzień (mierzalny, sprawdzalny za 7 dni):"
            value={goal}
            onChange={setGoal}
          />
          <div className="flex gap-2 items-center">
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>Prawdopodobieństwo realizacji:</span>
            <input
              type="number"
              min={0}
              max={100}
              value={probability}
              onChange={e => setProbability(e.target.value)}
              style={{ width: 60, border: "1px solid var(--color-border)", borderRadius: 4, padding: "2px 6px", fontSize: "var(--font-size-tiny)" }}
            />
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}>%</span>
          </div>
        </div>
      </div>

      {/* Custom footer — calls handleFinish */}
      <div className="sticky bottom-0 border-t" style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}>
        <div className="mx-auto px-4 py-3 flex justify-between" style={{ maxWidth: "var(--content-max-width)" }}>
          <a href={`/weekly/${weekStart}/step/10`} style={{ color: "var(--color-muted)", fontSize: 14 }}>← Wstecz</a>
          <button
            onClick={handleFinish}
            disabled={saving}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ background: "var(--color-mid)", color: "var(--color-white)" }}
          >
            {saving ? "Zapisuję..." : "Zakończ przegląd →"}
          </button>
        </div>
      </div>
    </WeeklyLayout>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/weekly/steps/WeeklyStep11Goal.tsx
git commit -m "feat: weekly step 11 — goal, mentor, stop-loss, finish"
```

---

## Task 13: Complete page

**Files:**
- Create: `app/(app)/weekly/[weekStart]/complete/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/(app)/weekly/[weekStart]/complete/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getWeeklyReview } from "@/actions/weekly"
import Link from "next/link"

export default async function WeeklyCompletePage({
  params,
}: {
  params: Promise<{ weekStart: string }>
}) {
  const { weekStart } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const review = await getWeeklyReview(weekStart)
  if (!review) redirect(`/weekly/${weekStart}/step/1`)

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="sticky top-0 z-10 border-b" style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}>
        <div className="mx-auto px-4 py-2" style={{ maxWidth: "var(--content-max-width)" }}>
          <Link href="/dashboard" className="font-bold uppercase tracking-wider"
            style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-gold)", textDecoration: "none" }}>
            The Forge
          </Link>
        </div>
      </div>

      <div className="mx-auto px-4 py-8 flex flex-col gap-6" style={{ maxWidth: "var(--content-max-width)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-gold)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
            Przegląd tygodniowy · {weekStart}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
            Tydzień zamknięty.
          </h1>
          {review.oneSentenceSummary && (
            <p style={{ fontSize: "var(--font-size-body)", color: "var(--color-muted)", fontStyle: "italic" }}>
              „{review.oneSentenceSummary}"
            </p>
          )}
        </div>

        {review.processGoalNextWeek && (
          <div style={{ padding: "12px 16px", borderLeft: "3px solid var(--color-gold)", background: "var(--color-light)" }}>
            <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>
              Cel na przyszły tydzień:
            </p>
            <p style={{ fontSize: "var(--font-size-body)", color: "var(--color-text)" }}>
              {review.processGoalNextWeek}
              {review.processGoalProbability && (
                <span style={{ color: "var(--color-muted)", marginLeft: 8 }}>({review.processGoalProbability}%)</span>
              )}
            </p>
          </div>
        )}

        {review.bridgeStrategicTopic && (
          <div style={{ padding: "12px 16px", borderLeft: "3px solid var(--color-mid)", background: "var(--color-light)" }}>
            <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>
              Temat strategiczny (Most do Daily):
            </p>
            <p style={{ fontSize: "var(--font-size-body)", color: "var(--color-text)" }}>
              {review.bridgeStrategicTopic}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href={`/weekly/${weekStart}/step/1`}
            className="block text-center px-6 py-3 rounded font-medium"
            style={{ background: "var(--color-border)", color: "var(--color-text)", fontSize: 14 }}
          >
            Edytuj przegląd
          </Link>
          <Link
            href="/dashboard"
            className="block text-center px-6 py-3 rounded font-medium"
            style={{ background: "var(--color-mid)", color: "var(--color-white)", fontSize: 14 }}
          >
            Wróć do dashboardu →
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add app/(app)/weekly/
git commit -m "feat: weekly review complete page"
```

---

## Task 14: Dashboard integration

**Files:**
- Create: `components/dashboard/WeeklyAction.tsx`
- Modify: `app/(app)/dashboard/page.tsx`

Show a Weekly Review CTA when there are completed daily cards in the current week.

- [ ] **Step 1: Create WeeklyAction component**

```tsx
// components/dashboard/WeeklyAction.tsx
import Link from "next/link"

interface WeeklyActionProps {
  weekStart: string
  status: "none" | "IN_PROGRESS" | "COMPLETED"
}

export function WeeklyAction({ weekStart, status }: WeeklyActionProps) {
  if (status === "COMPLETED") {
    return (
      <Link
        href={`/weekly/${weekStart}/complete`}
        className="block text-center px-6 py-2 rounded font-medium"
        style={{ background: "var(--color-dark)", color: "var(--color-white)", fontSize: 13 }}
      >
        Przegląd tygodniowy · {weekStart} — ukończony
      </Link>
    )
  }

  if (status === "IN_PROGRESS") {
    return (
      <Link
        href={`/weekly/${weekStart}/step/1`}
        className="block text-center px-6 py-2 rounded font-medium"
        style={{ background: "var(--color-gold)", color: "var(--color-white)", fontSize: 13 }}
      >
        Dokończ przegląd tygodniowy →
      </Link>
    )
  }

  return (
    <Link
      href={`/weekly/${weekStart}/step/1`}
      className="block text-center px-6 py-2 rounded font-medium"
      style={{ background: "var(--color-mid)", color: "var(--color-white)", fontSize: 13 }}
    >
      Rozpocznij przegląd tygodniowy
    </Link>
  )
}
```

- [ ] **Step 2: Update dashboard/page.tsx**

Add helper to compute current week's Monday and check if there are any completed daily cards this week, then show WeeklyAction.

In `app/(app)/dashboard/page.tsx`, after the existing imports add:

```tsx
import { WeeklyAction } from "@/components/dashboard/WeeklyAction"
```

Add this helper function at the top of the component (before the `return`):

```tsx
// Compute current week's Monday (UTC)
function getCurrentWeekStart(now: Date): string {
  const dow = now.getUTCDay() // 0=Sun, 1=Mon...
  const daysFromMon = dow === 0 ? 6 : dow - 1
  const mon = new Date(now)
  mon.setUTCDate(now.getUTCDate() - daysFromMon)
  return `${mon.getUTCFullYear()}-${String(mon.getUTCMonth() + 1).padStart(2, "0")}-${String(mon.getUTCDate()).padStart(2, "0")}`
}
```

In the data-fetching section, add:

```tsx
const weekStartStr = getCurrentWeekStart(now)
const weekStartDate = new Date(weekStartStr)
const weekEndDate = new Date(weekStartDate)
weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 4)

const [monthCards, recentCards, weeklyCardCount, currentWeeklyReview] = await Promise.all([
  prisma.dailyCard.findMany({ where: { userId, date: { gte: monthStart, lte: monthEnd } }, select: { date: true, status: true } }),
  prisma.dailyCard.findMany({ where: { userId, date: { lt: today } }, select: { date: true, status: true }, orderBy: { date: "desc" }, take: 14 }),
  prisma.dailyCard.count({ where: { userId, date: { gte: weekStartDate, lte: weekEndDate }, status: "COMPLETED" } }),
  prisma.weeklyReview.findUnique({ where: { userId_weekStart: { userId, weekStart: weekStartDate } }, select: { status: true } }),
])
```

In the JSX, add `WeeklyAction` after `PrimaryAction`:

```tsx
{weeklyCardCount >= 1 && (
  <WeeklyAction
    weekStart={weekStartStr}
    status={currentWeeklyReview?.status ?? "none"}
  />
)}
```

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit
git add components/dashboard/WeeklyAction.tsx app/(app)/dashboard/page.tsx
git commit -m "feat: dashboard weekly review CTA based on current week cards"
```

---

## Self-review checklist

- [x] All 16 spec sections covered across 11 steps
- [x] `bridgeStrategicTopic` and `bridgePreMortemItems` (Bridge 2) implemented in Step 9
- [x] `lastWeekGoalRecap` (Bridge 4) shown in header of every step
- [x] Stats tables use `computeWeeklyStats` data (Bridge 3)
- [x] `repeatingErrors` and `practicePlan` use JSON with typed shapes
- [x] `status: COMPLETED` set on finish (Step 11)
- [x] Complete page shows goal, strategic topic, edit link
- [x] Dashboard shows CTA when ≥1 completed daily card this week
- [x] No TBD or placeholder steps — all code is complete
- [x] Type consistency: `updateWeeklyReview(review.id, {...})` used uniformly across all steps
- [x] `getEdgeTrend` added to `actions/weekly.ts`
- [x] `EdgeWeekData` exported from `actions/weekly.ts` for use in step 3
