# Card Editing + Mentor Comment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow editing of completed cards and add a mentor comment field that propagates to the next morning's Step 1.

**Architecture:** New schema fields (`mentorComment`, `yesterdayMentorComment`) on `DailyCard`; new bridge function in `lib/bridges.ts`; new server action in `actions/cards.ts`; COMPLETED guard removed from wizard pages; complete page extended with mentor comment form and edit button; Step1Lesson extended with mentor comment block.

**Tech Stack:** Next.js 15 App Router, Prisma, PostgreSQL, Vitest + Testing Library

---

### Task 1: Add schema fields and migrate

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add two fields to DailyCard model**

In `prisma/schema.prisma`, add after the `tomorrowRemember` field:

```prisma
  mentorComment          String?
  yesterdayMentorComment String?
```

The end of the morning/evening fields section should look like:
```prisma
  proudOf            String?
  ashamedOf          String?
  tomorrowRemember   String?
  mentorComment      String?
  yesterdayMentorComment String?
```

- [ ] **Step 2: Run migration**

```powershell
npx prisma migrate dev --name add_mentor_comment
```

Expected output:
```
Applying migration `..._add_mentor_comment`
Your database is now in sync with your schema.
```

- [ ] **Step 3: Verify Prisma client regenerated**

```powershell
npx prisma generate
```

Expected: no errors.

- [ ] **Step 4: Commit**

```powershell
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add mentorComment and yesterdayMentorComment to DailyCard schema"
```

---

### Task 2: Add bridge function for yesterday's mentor comment

**Files:**
- Modify: `lib/bridges.ts`

- [ ] **Step 1: Write the failing test**

In `__tests__/lib/bridges.test.ts` (create file):

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { getYesterdayMentorComment } from "@/lib/bridges"

vi.mock("@/lib/db", () => ({
  prisma: {
    dailyCard: {
      findFirst: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/db"

describe("getYesterdayMentorComment", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns mentorComment from the most recent card with a comment", async () => {
    vi.mocked(prisma.dailyCard.findFirst).mockResolvedValue({
      mentorComment: "Dobra robota z setupem A.",
    } as any)

    const result = await getYesterdayMentorComment("user-1", new Date("2026-05-06"))
    expect(result).toBe("Dobra robota z setupem A.")
  })

  it("returns null when no card has a mentor comment", async () => {
    vi.mocked(prisma.dailyCard.findFirst).mockResolvedValue(null)

    const result = await getYesterdayMentorComment("user-1", new Date("2026-05-06"))
    expect(result).toBeNull()
  })

  it("queries only cards before the given date", async () => {
    vi.mocked(prisma.dailyCard.findFirst).mockResolvedValue(null)

    await getYesterdayMentorComment("user-1", new Date("2026-05-06"))

    expect(prisma.dailyCard.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: expect.objectContaining({ lt: new Date("2026-05-06") }),
          mentorComment: { not: null },
        }),
      })
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npx vitest run __tests__/lib/bridges.test.ts
```

Expected: FAIL — `getYesterdayMentorComment` is not exported.

- [ ] **Step 3: Add function to bridges.ts**

Append to `lib/bridges.ts`:

```ts
export async function getYesterdayMentorComment(userId: string, date: Date): Promise<string | null> {
  const card = await prisma.dailyCard.findFirst({
    where: {
      userId,
      date: { lt: date },
      mentorComment: { not: null },
    },
    orderBy: { date: "desc" },
    select: { mentorComment: true },
  })
  return card?.mentorComment ?? null
}
```

- [ ] **Step 4: Run test to verify it passes**

```powershell
npx vitest run __tests__/lib/bridges.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```powershell
git add lib/bridges.ts __tests__/lib/bridges.test.ts
git commit -m "feat: add getYesterdayMentorComment bridge function"
```

---

### Task 3: Wire bridge into getOrCreateDailyCard + add updateMentorComment action

**Files:**
- Modify: `actions/cards.ts`

- [ ] **Step 1: Import new bridge function**

In `actions/cards.ts`, update the import on line 5:

```ts
import { getYesterdayLesson, getLastWeekLesson, getYesterdayMentorComment } from "@/lib/bridges"
```

- [ ] **Step 2: Use it in getOrCreateDailyCard**

Replace the body of `getOrCreateDailyCard` (lines 15–31) with:

```ts
export async function getOrCreateDailyCard(dateStr: string) {
  const userId = await requireUser()
  const date = new Date(dateStr)

  const yesterdayLesson = await getYesterdayLesson(userId, date)
  const lastWeekLesson = await getLastWeekLesson(userId, date)
  const yesterdayMentorComment = await getYesterdayMentorComment(userId, date)

  return prisma.dailyCard.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, yesterdayLesson, lastWeekLesson, yesterdayMentorComment },
    update: {},
    include: {
      trades: { orderBy: { createdAt: "asc" } },
      emotionEntries: { orderBy: { createdAt: "asc" } },
    },
  })
}
```

- [ ] **Step 3: Add updateMentorComment server action**

Append to `actions/cards.ts`:

```ts
export async function updateMentorComment(id: string, mentorComment: string) {
  const userId = await requireUser()
  const card = await prisma.dailyCard.findFirst({ where: { id, userId } })
  if (!card) throw new Error("Card not found")
  await prisma.dailyCard.update({ where: { id }, data: { mentorComment } })
  revalidatePath("/dashboard")
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```powershell
git add actions/cards.ts
git commit -m "feat: wire yesterdayMentorComment into card creation, add updateMentorComment action"
```

---

### Task 4: Allow editing completed cards in wizard

**Files:**
- Modify: `app/(app)/cards/[date]/morning/[step]/page.tsx`
- Modify: `app/(app)/cards/[date]/evening/[step]/page.tsx`

- [ ] **Step 1: Remove COMPLETED guard from morning page**

In `app/(app)/cards/[date]/morning/[step]/page.tsx`, delete lines:

```ts
  if (card.status === "COMPLETED") redirect(`/cards/${date}/complete`)
```

The page now uses `getOrCreateDailyCard` for any status — MORNING or COMPLETED.

- [ ] **Step 2: Remove COMPLETED guard from evening page**

In `app/(app)/cards/[date]/evening/[step]/page.tsx`, delete line:

```ts
  if (card.status === "COMPLETED") redirect(`/cards/${date}/complete`)
```

The remaining guard `if (!card) redirect(...)` stays — that's correct.

- [ ] **Step 3: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```powershell
git add app/(app)/cards/
git commit -m "feat: allow re-editing completed daily cards"
```

---

### Task 5: Extend complete page with mentor comment form and edit button

**Files:**
- Modify: `app/(app)/cards/[date]/complete/page.tsx`

- [ ] **Step 1: Create MentorCommentForm client component**

Create `components/dashboard/MentorCommentForm.tsx`:

```tsx
"use client"

import { useState } from "react"
import { updateMentorComment } from "@/actions/cards"

interface Props {
  cardId: string
  initialComment: string | null
}

export function MentorCommentForm({ cardId, initialComment }: Props) {
  const [value, setValue] = useState(initialComment ?? "")
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateMentorComment(cardId, value)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2 w-full" style={{ maxWidth: 400 }}>
      <p
        className="font-medium uppercase tracking-wide"
        style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
      >
        Komentarz mentora
      </p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        placeholder="Wpisz komentarz mentora po sesji feedbackowej..."
        className="w-full rounded px-3 py-2 resize-none"
        style={{
          border: "1px solid var(--color-border)",
          fontSize: "var(--font-size-body)",
          color: "var(--color-text)",
          background: "var(--color-white)",
        }}
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 rounded font-medium"
        style={{
          background: saving ? "var(--color-border)" : "var(--color-mid)",
          color: "var(--color-white)",
          fontSize: "var(--font-size-tiny)",
          cursor: saving ? "not-allowed" : "pointer",
          border: "none",
          alignSelf: "flex-end",
        }}
      >
        {saved ? "Zapisano" : saving ? "Zapisuję..." : "Zapisz komentarz"}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Update complete page to use the form and add edit button**

Replace the full content of `app/(app)/cards/[date]/complete/page.tsx` with:

```tsx
import Link from "next/link"
import { getDailyCard } from "@/actions/cards"
import { redirect } from "next/navigation"
import { MentorCommentForm } from "@/components/dashboard/MentorCommentForm"

export default async function CompletePage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params
  const card = await getDailyCard(date)
  if (!card || card.status !== "COMPLETED") redirect(`/cards/${date}/morning/1`)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="text-center">
        <p
          style={{
            color: "var(--color-gold)",
            fontSize: "var(--font-size-tiny)",
            fontWeight: "var(--font-weight-bold)",
          }}
        >
          THE FORGE
        </p>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--color-dark)" }}>
          Dzień ukończony
        </h1>
        <p className="mt-2" style={{ color: "var(--color-muted)", fontSize: "var(--font-size-body)" }}>
          Dobra robota. Karta dzienna zapisana.
        </p>
      </div>

      <MentorCommentForm cardId={card.id} initialComment={card.mentorComment} />

      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 300 }}>
        <a
          href={`/api/cards/${date}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center px-4 py-2 rounded font-medium"
          style={{ background: "var(--color-gold)", color: "var(--color-white)" }}
        >
          Pobierz kartę (PDF)
        </a>
        <Link
          href={`/cards/${date}/morning/1`}
          className="block text-center px-4 py-2 rounded"
          style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)", fontSize: 14 }}
        >
          Edytuj kartę
        </Link>
        <Link
          href="/dashboard"
          className="block text-center px-4 py-2 rounded"
          style={{ background: "var(--color-mid)", color: "var(--color-white)" }}
        >
          Wróć do dashboardu
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```powershell
git add app/(app)/cards/ components/dashboard/MentorCommentForm.tsx
git commit -m "feat: add mentor comment form and edit button to complete page"
```

---

### Task 6: Show yesterday's mentor comment in Step 1 morning

**Files:**
- Modify: `components/wizard/steps/morning/Step1Lesson.tsx`

- [ ] **Step 1: Write the failing test**

In `__tests__/components/wizard/steps/morning/Step1Lesson.test.tsx` (create file):

```tsx
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Step1Lesson } from "@/components/wizard/steps/morning/Step1Lesson"

const baseCard = {
  id: "card-1",
  yesterdayLesson: "Czekaj na potwierdzenie setupu.",
  yesterdayMentorComment: null,
  lastWeekLesson: null,
  trades: [],
  emotionEntries: [],
} as any

describe("Step1Lesson - mentor comment", () => {
  it("does not render mentor comment block when null", () => {
    render(
      <Step1Lesson card={baseCard} date="2026-05-06" step={1} bridge2Items={[]} />
    )
    expect(screen.queryByText("KOMENTARZ MENTORA:")).not.toBeInTheDocument()
  })

  it("renders mentor comment block when present", () => {
    const card = { ...baseCard, yesterdayMentorComment: "Dobra dyscyplina ryzyka." }
    render(
      <Step1Lesson card={card} date="2026-05-06" step={1} bridge2Items={[]} />
    )
    expect(screen.getByText("KOMENTARZ MENTORA:")).toBeInTheDocument()
    expect(screen.getByText("Dobra dyscyplina ryzyka.")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npx vitest run __tests__/components/wizard/steps/morning/Step1Lesson.test.tsx
```

Expected: FAIL — mentor comment block not found.

- [ ] **Step 3: Add mentor comment block to Step1Lesson**

In `components/wizard/steps/morning/Step1Lesson.tsx`, add the block after the `yesterdayLesson` block (after the closing `</div>` of the "Yesterday's lesson" section, before the `lastWeekLesson` block):

```tsx
        {/* Mentor comment from yesterday */}
        {card.yesterdayMentorComment && (
          <div>
            <BridgeIndicator source="komentarz mentora" />
            <p
              className="mb-2 font-medium uppercase tracking-wide"
              style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-muted)" }}
            >
              KOMENTARZ MENTORA:
            </p>
            <p
              className="px-4 py-3 rounded"
              style={{
                background: "var(--color-light)",
                borderLeft: `3px solid var(--color-mid)`,
                fontSize: "var(--font-size-body)",
                color: "var(--color-text)",
                fontStyle: "italic",
              }}
            >
              {card.yesterdayMentorComment}
            </p>
          </div>
        )}
```

- [ ] **Step 4: Run test to verify it passes**

```powershell
npx vitest run __tests__/components/wizard/steps/morning/Step1Lesson.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Run all tests to check for regressions**

```powershell
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```powershell
git add components/wizard/steps/morning/Step1Lesson.tsx __tests__/components/wizard/steps/morning/
git commit -m "feat: show yesterday's mentor comment in morning Step 1"
```
