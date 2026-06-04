# Table UX + Missing Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make evening session tables usable (expandable textarea cells, fix number inputs), and add the missing "Dziś w jednym zdaniu" field to Step 15.

**Architecture:** TableInput gets a new `"textarea"` column type with auto-grow behaviour; number inputs get CSS to remove spinner arrows. Step6 and Step7 column definitions updated. New `todayInOneSentence` schema field wired through server action and Step15 UI.

**Tech Stack:** Next.js 15, React, Prisma, Vitest + Testing Library, Tailwind CSS

---

### Task 1: Add textarea type and fix number inputs in TableInput

**Files:**
- Modify: `components/forge/TableInput.tsx`
- Modify: `app/globals.css`
- Test: `__tests__/components/forge/TableInput.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/forge/TableInput.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { TableInput } from "@/components/forge/TableInput"

const textColumns = [
  { id: "name", label: "Nazwa", type: "text" as const },
  { id: "notes", label: "Notatki", type: "textarea" as const },
]

const numberColumns = [
  { id: "val", label: "Wartość", type: "number" as const },
]

const rows = [{ name: "test", notes: "jakiś tekst", val: "2.5" }]

describe("TableInput", () => {
  it("renders textarea for textarea-type columns", () => {
    render(
      <TableInput columns={textColumns} rows={rows} onAddRow={vi.fn()} onUpdateRow={vi.fn()} />
    )
    expect(screen.getByDisplayValue("jakiś tekst").tagName).toBe("TEXTAREA")
  })

  it("renders input for text-type columns", () => {
    render(
      <TableInput columns={textColumns} rows={rows} onAddRow={vi.fn()} onUpdateRow={vi.fn()} />
    )
    expect(screen.getByDisplayValue("test").tagName).toBe("INPUT")
  })

  it("renders input with class no-spinner for number-type columns", () => {
    render(
      <TableInput columns={numberColumns} rows={[{ val: "2.5" }]} onAddRow={vi.fn()} onUpdateRow={vi.fn()} />
    )
    const input = screen.getByDisplayValue("2.5")
    expect(input).toHaveClass("no-spinner")
    expect(input).toHaveAttribute("type", "number")
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```powershell
npx vitest run __tests__/components/forge/TableInput.test.tsx
```

Expected: FAIL — `"textarea"` type not handled, `no-spinner` class not present.

- [ ] **Step 3: Add `.no-spinner` CSS class to globals.css**

Add at the end of `app/globals.css`:

```css
/* Remove number input spinners in TableInput */
.no-spinner::-webkit-inner-spin-button,
.no-spinner::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinner {
  -moz-appearance: textfield;
  appearance: textfield;
}
```

- [ ] **Step 4: Rewrite TableInput.tsx**

Replace the full content of `components/forge/TableInput.tsx`:

```tsx
export interface Column {
  id: string
  label: string
  width?: string
  type?: "text" | "number" | "select" | "textarea"
  options?: string[]
}

interface TableInputProps {
  columns: Column[]
  rows: Record<string, unknown>[]
  onAddRow: () => void
  onUpdateRow: (index: number, field: string, value: string | number) => void
  addLabel?: string
  emptyRows?: number
}

function AutoTextarea({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <textarea
      rows={1}
      value={value}
      onChange={(e) => {
        e.target.style.height = "auto"
        e.target.style.height = e.target.scrollHeight + "px"
        onChange(e.target.value)
      }}
      className="w-full bg-transparent border-none outline-none"
      style={{
        fontSize: "var(--font-size-tiny)",
        resize: "none",
        overflow: "hidden",
        lineHeight: "1.4",
        padding: "2px 0",
      }}
    />
  )
}

export function TableInput({
  columns,
  rows,
  onAddRow,
  onUpdateRow,
  addLabel = "+ Dodaj",
  emptyRows = 3,
}: TableInputProps) {
  const placeholderCount = rows.length === 0 ? emptyRows : 0

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr style={{ background: "var(--color-mid)" }}>
            {columns.map((col) => (
              <th
                key={col.id}
                className="px-2 py-1 font-medium"
                style={{
                  color: "var(--color-white)",
                  fontSize: "var(--font-size-tiny)",
                  width: col.width,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `0.5px solid var(--color-border)` }}>
              {columns.map((col) => (
                <td key={col.id} className="px-1 py-0.5" style={{ verticalAlign: "top" }}>
                  {col.type === "select" && col.options ? (
                    <select
                      value={String(row[col.id] ?? "")}
                      onChange={(e) => onUpdateRow(i, col.id, e.target.value)}
                      className="w-full bg-transparent border-none outline-none"
                      style={{ fontSize: "var(--font-size-tiny)" }}
                    >
                      <option value="" />
                      {col.options.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : col.type === "textarea" ? (
                    <AutoTextarea
                      value={String(row[col.id] ?? "")}
                      onChange={(v) => onUpdateRow(i, col.id, v)}
                    />
                  ) : (
                    <input
                      type={col.type ?? "text"}
                      value={String(row[col.id] ?? "")}
                      onChange={(e) => onUpdateRow(i, col.id, e.target.value)}
                      className={`w-full bg-transparent border-none outline-none${col.type === "number" ? " no-spinner" : ""}`}
                      style={{ fontSize: "var(--font-size-tiny)" }}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
          {Array.from({ length: placeholderCount }).map((_, i) => (
            <tr key={`ph-${i}`} style={{ borderBottom: `0.5px solid var(--color-border)` }}>
              {columns.map((col) => (
                <td key={col.id} className="px-1 py-0.5">
                  <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-border)" }}>—</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={onAddRow}
        className="mt-2 text-sm"
        style={{ color: "var(--color-muted)" }}
      >
        {addLabel}
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

```powershell
npx vitest run __tests__/components/forge/TableInput.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 6: Run all tests**

```powershell
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```powershell
git add components/forge/TableInput.tsx app/globals.css __tests__/components/forge/TableInput.test.tsx
git commit -m "feat: add textarea type to TableInput, fix number input spinners"
```

---

### Task 2: Update Step6TradeLog column definitions

**Files:**
- Modify: `components/wizard/steps/evening/Step6TradeLog.tsx`

- [ ] **Step 1: Update column definitions**

In `components/wizard/steps/evening/Step6TradeLog.tsx`, replace `TRADE_COLUMNS`:

```tsx
const TRADE_COLUMNS = [
  { id: "time",      label: "Czas",    width: "7%" },
  { id: "trigger",   label: "Trigger", width: "13%", type: "textarea" as const },
  { id: "setup",     label: "Setup",   width: "15%", type: "textarea" as const },
  { id: "direction", label: "Kier.",   width: "7%",  type: "select" as const, options: ["long", "short"] },
  { id: "tier",      label: "Tier",    width: "7%",  type: "select" as const, options: ["A", "B", "C"] },
  { id: "rExpected", label: "R plan.", width: "10%", type: "number" as const },
  { id: "rActual",   label: "R real.", width: "10%", type: "number" as const },
  { id: "emotion",   label: "Emocja",  width: "13%", type: "textarea" as const },
  { id: "lessons",   label: "Lekcje",  width: "18%", type: "textarea" as const },
]
```

Changes from previous version:
- `trigger`, `setup`, `emotion`, `lessons` → added `type: "textarea"`
- `rExpected`, `rActual` → widened from `"9%"` to `"10%"`
- `direction`, `tier` → narrowed from `"8%"` to `"7%"` (to balance total = 100%)

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
git add components/wizard/steps/evening/Step6TradeLog.tsx
git commit -m "feat: use textarea columns in Step6 trade log, widen R columns"
```

---

### Task 3: Update Step7EmotionLog column definitions

**Files:**
- Modify: `components/wizard/steps/evening/Step7EmotionLog.tsx`

- [ ] **Step 1: Update column definitions**

In `components/wizard/steps/evening/Step7EmotionLog.tsx`, replace `EMOTION_COLUMNS`:

```tsx
const EMOTION_COLUMNS = [
  { id: "time",           label: "Czas",                width: "7%" },
  { id: "emotion",        label: "Emocja",              width: "15%" },
  { id: "triggerContext", label: "Trigger / kontekst",  width: "26%", type: "textarea" as const },
  { id: "meaningSignal",  label: "Znaczenie (sygnał)",  width: "26%", type: "textarea" as const },
  { id: "reaction",       label: "Reakcja",             width: "26%", type: "textarea" as const },
]
```

Changes: `triggerContext`, `meaningSignal`, `reaction` → added `type: "textarea"`.

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
git add components/wizard/steps/evening/Step7EmotionLog.tsx
git commit -m "feat: use textarea columns in Step7 emotion log"
```

---

### Task 4: Add todayInOneSentence to schema and migrate

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_today_in_one_sentence/migration.sql`

- [ ] **Step 1: Add field to schema**

In `prisma/schema.prisma`, add after `tomorrowRemember`:

```prisma
  todayInOneSentence String?
```

The block should now read:
```prisma
  proudOf            String?
  ashamedOf          String?
  tomorrowRemember   String?
  todayInOneSentence String?
  mentorComment      String?
  yesterdayMentorComment String?
```

- [ ] **Step 2: Run migration**

```powershell
npx prisma migrate dev --name add_today_in_one_sentence
```

Expected output:
```
Applying migration `..._add_today_in_one_sentence`
Your database is now in sync with your schema.
```

- [ ] **Step 3: Commit**

```powershell
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add todayInOneSentence field to DailyCard schema"
```

---

### Task 5: Add todayInOneSentence to updateDailyCard

**Files:**
- Modify: `actions/cards.ts`

- [ ] **Step 1: Add field to Partial type**

In `actions/cards.ts`, in the `updateDailyCard` Partial type, add `todayInOneSentence` after `tomorrowRemember`:

```ts
    proudOf: string; ashamedOf: string; tomorrowRemember: string; todayInOneSentence: string
```

The full Partial should now read:
```ts
data: Partial<{
  sleep: number; energy: number; focus: number; prepQuality: number; moodNotes: string
  trendBias: string; keyLevels: string; macroNews: string; correlations: string
  whatIfs: string; entryConditions: string; tierASetup: string; tierBSetup: string; tierCSetup: string
  preMortem: string; dailyGoal: string
  strengthsUsed: string; improvementWhen: string; improvementThen: string; improvementExtra: string
  mentalAfter: number; whatShapedIt: string; deliberatePractice: string
  processScore: number; pl: string; overallScore: number
  proudOf: string; ashamedOf: string; tomorrowRemember: string; todayInOneSentence: string
  setupsScore: number; executionScore: number; riskScore: number; psychologyScore: number; disciplineScore: number
  status: CardStatus
}>
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```powershell
git add actions/cards.ts
git commit -m "feat: add todayInOneSentence to updateDailyCard action"
```

---

### Task 6: Add todayInOneSentence field to Step15Tomorrow

**Files:**
- Modify: `components/wizard/steps/evening/Step15Tomorrow.tsx`
- Create: `__tests__/components/wizard/steps/evening/Step15Tomorrow.test.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/wizard/steps/evening/Step15Tomorrow.test.tsx`:

```tsx
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Step15Tomorrow } from "@/components/wizard/steps/evening/Step15Tomorrow"

const baseCard = {
  id: "card-1",
  tomorrowRemember: "",
  todayInOneSentence: null,
  trades: [],
  emotionEntries: [],
} as any

describe("Step15Tomorrow - todayInOneSentence", () => {
  it("renders the 'Dziś w jednym zdaniu' field", () => {
    render(<Step15Tomorrow card={baseCard} date="2026-05-07" step={15} />)
    expect(screen.getByText("Dziś w jednym zdaniu:")).toBeInTheDocument()
  })

  it("pre-fills the field when card has value", () => {
    const card = { ...baseCard, todayInOneSentence: "Dobry dzień, czekałem na setup." }
    render(<Step15Tomorrow card={card} date="2026-05-07" step={15} />)
    expect(screen.getByDisplayValue("Dobry dzień, czekałem na setup.")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npx vitest run __tests__/components/wizard/steps/evening/Step15Tomorrow.test.tsx
```

Expected: FAIL — "Dziś w jednym zdaniu:" not in document.

- [ ] **Step 3: Update Step15Tomorrow.tsx**

Replace the full content of `components/wizard/steps/evening/Step15Tomorrow.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardLayout } from "@/components/wizard/WizardLayout"
import { SectionHeader, TextArea, TextInput } from "@/components/forge"
import { updateDailyCard } from "@/actions/cards"
import type { DailyCard } from "@prisma/client"

interface Props {
  card: DailyCard & { trades: any[]; emotionEntries: any[] }
  date: string
  step: number
}

export function Step15Tomorrow({ card, date, step }: Props) {
  const router = useRouter()
  const [todayInOneSentence, setTodayInOneSentence] = useState(card.todayInOneSentence ?? "")
  const [tomorrowRemember, setTomorrowRemember] = useState(card.tomorrowRemember ?? "")
  const [saving, setSaving] = useState(false)

  async function handleFinish() {
    setSaving(true)
    await updateDailyCard(card.id, { todayInOneSentence, tomorrowRemember, status: "COMPLETED" })
    router.push(`/cards/${date}/complete`)
  }

  return (
    <WizardLayout
      date={date}
      session="evening"
      currentStep={step}
      totalSteps={15}
      stepLabel="Lekcja na jutro"
      prevHref={`/cards/${date}/evening/14`}
    >
      <div className="flex flex-col gap-6">
        <div>
          <SectionHeader number="14" title="LEKCJA NA JUTRO" />
          <div className="flex flex-col gap-4 mt-4">
            <TextInput
              label="Dziś w jednym zdaniu:"
              value={todayInOneSentence}
              onChange={setTodayInOneSentence}
              placeholder="Jak opisałbyś ten dzień w jednym zdaniu?"
            />
            <TextArea
              label="Jutro pamiętaj o:"
              value={tomorrowRemember}
              onChange={setTomorrowRemember}
              rows={6}
              placeholder="To pole pojawi się jutro na górze Twojej karty dziennej."
            />
            <p style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)", fontStyle: "italic" }}>
              Lekcja pojawi się automatycznie na górze jutrzejszej karty dziennej.
            </p>
          </div>
        </div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 border-t"
        style={{ background: "var(--color-white)", borderColor: "var(--color-border)" }}
      >
        <div
          className="mx-auto px-4 py-3 flex justify-between"
          style={{ maxWidth: "var(--content-max-width)" }}
        >
          <a href={`/cards/${date}/evening/14`} style={{ color: "var(--color-muted)", fontSize: "var(--font-size-body)" }}>
            ← Wstecz
          </a>
          <button
            onClick={handleFinish}
            disabled={saving}
            className="px-6 py-2 rounded font-medium"
            style={{ background: "var(--color-gold)", color: "var(--color-white)", fontSize: "var(--font-size-body)" }}
          >
            {saving ? "Zapisuję..." : "Zakończ dzień"}
          </button>
        </div>
      </div>
    </WizardLayout>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```powershell
npx vitest run __tests__/components/wizard/steps/evening/Step15Tomorrow.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Run all tests**

```powershell
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```powershell
git add components/wizard/steps/evening/Step15Tomorrow.tsx __tests__/components/wizard/steps/evening/
git commit -m "feat: add todayInOneSentence field to Step15 evening session"
```
