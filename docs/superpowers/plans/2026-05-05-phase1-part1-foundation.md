# The Forge — Phase 1 MVP: Part 1 — Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize The Forge project with working auth, database schema, design system tokens, and core UI components. After this part: a deployable app where users can register, log in, and see the design system components render correctly.

**Architecture:** Next.js 15 App Router, TypeScript, Tailwind v3, shadcn/ui, Auth.js v5 (JWT + Credentials), Prisma + PostgreSQL, Vitest + React Testing Library.

**Working directory:** `C:\projekty\forge\WEB\` — initialize the Next.js project HERE so existing docs coexist with the new app.

**Continues in:** `2026-05-05-phase1-part2-wizard.md` and `2026-05-05-phase1-part3-completion.md`

---

## File Map (Part 1)

```
WEB/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── vitest.config.ts
├── auth.ts                          ← Auth.js v5 config
├── middleware.ts                    ← route protection
├── .env.example
├── .env.local                       ← NOT committed
├── prisma/
│   └── schema.prisma
├── lib/
│   └── db.ts                        ← Prisma singleton
├── actions/
│   └── auth.ts                      ← register Server Action
├── i18n/
│   ├── routing.ts
│   └── request.ts
├── messages/
│   └── pl.json
├── styles/
│   └── tokens.css
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   └── api/auth/[...nextauth]/route.ts
├── components/
│   └── forge/
│       ├── SectionHeader.tsx
│       ├── DotRow.tsx
│       ├── TextInput.tsx
│       ├── TextArea.tsx
│       ├── GoldCircles.tsx
│       ├── TableInput.tsx
│       ├── ImplementationIntention.tsx
│       ├── BridgeIndicator.tsx
│       └── index.ts
└── __tests__/
    ├── setup.ts
    └── components/forge/
        ├── DotRow.test.tsx
        └── GoldCircles.test.tsx
```

---

## Task 1: Initialize Next.js 15 project

**Files:** Creates all root config files.

- [ ] **Step 1: Run Next.js scaffolding inside WEB/**

```powershell
cd C:\projekty\forge\WEB
pnpm create next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --no-turbopack
```

When prompted, confirm: TypeScript ✓, Tailwind ✓, App Router ✓, no src/ dir ✓.

- [ ] **Step 2: Install app dependencies**

```powershell
pnpm add next-auth@beta @prisma/client bcryptjs next-intl puppeteer
pnpm add -D prisma @types/bcryptjs
```

- [ ] **Step 3: Install shadcn/ui**

```powershell
pnpm dlx shadcn@latest init
```

Choose: Default style, slate base color, CSS variables yes. Then add components:

```powershell
pnpm dlx shadcn@latest add button input label form textarea dialog
```

- [ ] **Step 4: Create .env.example and .env.local**

Create `.env.example`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/the_forge"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

Create `.env.local` (actual values, never committed):
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/the_forge"
NEXTAUTH_SECRET="dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 5: Initialize git and first commit**

```powershell
git init
git add .gitignore
git commit -m "chore: add .gitignore"
git add .
git commit -m "chore: initialize Next.js 15 + shadcn/ui + dependencies"
```

---

## Task 2: Set up Vitest + React Testing Library

**Files:**
- Create: `vitest.config.ts`
- Create: `__tests__/setup.ts`

- [ ] **Step 1: Install test dependencies**

```powershell
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Create vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
```

- [ ] **Step 3: Create __tests__/setup.ts**

```typescript
// __tests__/setup.ts
import "@testing-library/jest-dom"
```

- [ ] **Step 4: Add test script to package.json**

```json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 5: Write a smoke test and verify it passes**

Create `__tests__/smoke.test.ts`:
```typescript
import { describe, it, expect } from "vitest"

describe("vitest setup", () => {
  it("works", () => {
    expect(1 + 1).toBe(2)
  })
})
```

Run: `pnpm test:run`
Expected: PASS

- [ ] **Step 6: Delete smoke test and commit**

```powershell
rm __tests__/smoke.test.ts
git add -A
git commit -m "chore: set up Vitest + React Testing Library"
```

---

## Task 3: Prisma schema + database

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db.ts`

- [ ] **Step 1: Initialize Prisma**

```powershell
pnpm dlx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write schema.prisma**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String         @id @default(cuid())
  email          String         @unique
  password       String
  createdAt      DateTime       @default(now())
  dailyCards     DailyCard[]
  weeklyReviews  WeeklyReview[]
  calibrationGoals CalibrationGoal[]
}

model DailyCard {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  date            DateTime    @db.Date
  status          CardStatus  @default(MORNING)

  // morning
  sleep           Int?
  energy          Int?
  focus           Int?
  prepQuality     Int?
  moodNotes       String?
  trendBias       String?
  keyLevels       String?
  macroNews       String?
  correlations    String?
  whatIfs         String?
  entryConditions String?
  tierASetup      String?
  tierBSetup      String?
  tierCSetup      String?
  preMortem       String?
  dailyGoal       String?
  yesterdayLesson String?
  lastWeekLesson  String?

  // evening
  strengthsUsed      String?
  improvementWhen    String?
  improvementThen    String?
  improvementExtra   String?
  mentalAfter        Int?
  whatShapedIt       String?
  deliberatePractice String?
  processScore       Int?
  pl                 String?
  overallScore       Int?
  proudOf            String?
  ashamedOf          String?
  tomorrowRemember   String?

  trades         Trade[]
  emotionEntries EmotionEntry[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, date])
}

enum CardStatus {
  MORNING
  COMPLETED
}

model Trade {
  id          String    @id @default(cuid())
  dailyCardId String
  dailyCard   DailyCard @relation(fields: [dailyCardId], references: [id], onDelete: Cascade)
  time        String?
  trigger     String?
  setup       String?
  direction   String?
  tier        String?
  rExpected   Float?
  rActual     Float?
  decision    String?
  emotion     String?
  lessons     String?
  createdAt   DateTime  @default(now())
}

model EmotionEntry {
  id             String    @id @default(cuid())
  dailyCardId    String
  dailyCard      DailyCard @relation(fields: [dailyCardId], references: [id], onDelete: Cascade)
  time           String?
  emotion        String?
  triggerContext String?
  meaningSignal  String?
  reaction       String?
  createdAt      DateTime  @default(now())
}

model WeeklyReview {
  id                   String   @id @default(cuid())
  userId               String
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  weekStart            DateTime @db.Date
  weekEnd              DateTime @db.Date
  bridgeStrategicTopic  String?
  bridgePreMortemItems Json?
  processGoalNextWeek  String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@unique([userId, weekStart])
}

model CalibrationGoal {
  id                  String    @id @default(cuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  layer               String
  sourceId            String?
  goalText            String
  probabilityAssigned Int
  setAt               DateTime  @default(now())
  evaluatedAt         DateTime?
  outcome             String?
}
```

- [ ] **Step 3: Create lib/db.ts — Prisma singleton**

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

- [ ] **Step 4: Run migration**

Start local PostgreSQL (Docker one-liner if needed):
```powershell
docker run --name forge-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=the_forge -p 5432:5432 -d postgres:16
```

Then:
```powershell
pnpm dlx prisma migrate dev --name init
pnpm dlx prisma generate
```

Expected: Migration applied, Prisma client generated.

- [ ] **Step 5: Commit**

```powershell
git add prisma/ lib/db.ts
git commit -m "feat: add Prisma schema (DailyCard, Trade, EmotionEntry, WeeklyReview)"
```

---

## Task 4: Auth.js v5 — register, login, sessions

**Files:**
- Create: `auth.ts`
- Create: `middleware.ts`
- Create: `actions/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create auth.ts at project root**

```typescript
// auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!valid) return null

        return { id: user.id, email: user.email }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
})
```

- [ ] **Step 2: Create app/api/auth/[...nextauth]/route.ts**

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

- [ ] **Step 3: Create middleware.ts — protect /dashboard and /cards routes**

```typescript
// middleware.ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register")
  const isProtected = req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/cards")

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

- [ ] **Step 4: Create actions/auth.ts — register Server Action**

```typescript
// actions/auth.ts
"use server"

import { prisma } from "@/lib/db"
import { signIn } from "@/auth"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"

export async function registerUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password || password.length < 8) {
    return { error: "Email i hasło (min. 8 znaków) są wymagane." }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "Konto z tym emailem już istnieje." }
  }

  const hash = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { email, password: hash } })

  await signIn("credentials", { email, password, redirectTo: "/dashboard" })
}

export async function loginUser(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Nieprawidłowy email lub hasło." }
    }
    throw error
  }
}
```

- [ ] **Step 5: Extend NextAuth types for user.id**

Create `types/next-auth.d.ts`:
```typescript
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"]
  }
}
```

- [ ] **Step 6: Commit**

```powershell
git add auth.ts middleware.ts actions/auth.ts app/api/ types/
git commit -m "feat: Auth.js v5 with Credentials provider, register/login actions"
```

---

## Task 5: next-intl + Polish strings

**Files:**
- Create: `i18n/routing.ts`
- Create: `i18n/request.ts`
- Create: `messages/pl.json`
- Modify: `next.config.ts`

- [ ] **Step 1: Create i18n/routing.ts**

```typescript
// i18n/routing.ts
import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["pl"],
  defaultLocale: "pl",
})
```

- [ ] **Step 2: Create i18n/request.ts**

```typescript
// i18n/request.ts
import { getRequestConfig } from "next-intl/server"

export default getRequestConfig(async () => ({
  locale: "pl",
  messages: (await import(`../messages/pl.json`)).default,
}))
```

- [ ] **Step 3: Update next.config.ts to use next-intl plugin**

```typescript
// next.config.ts
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const nextConfig = {}

export default withNextIntl(nextConfig)
```

- [ ] **Step 4: Create messages/pl.json (complete Polish strings)**

```json
{
  "auth": {
    "loginTitle": "Zaloguj się do The Forge",
    "registerTitle": "Utwórz konto w The Forge",
    "email": "Email",
    "password": "Hasło",
    "loginButton": "Zaloguj",
    "registerButton": "Zarejestruj",
    "noAccount": "Nie masz konta?",
    "hasAccount": "Masz już konto?",
    "registerLink": "Zarejestruj się",
    "loginLink": "Zaloguj się"
  },
  "landing": {
    "title": "The Forge",
    "tagline": "Prawdziwi traderzy są wykuwani w ogniu.",
    "description": "System transformacji tradera. 5 warstw refleksji — od dziennej do rocznej.",
    "cta": "Zacznij swoją praktykę"
  },
  "dashboard": {
    "title": "Dashboard",
    "startCard": "Rozpocznij kartę dzienną",
    "continueMorning": "Kontynuuj sesję poranną",
    "continueEvening": "Wróć do sesji wieczornej",
    "downloadPdf": "Pobierz PDF",
    "viewCard": "Podgląd",
    "lessonBannerLabel": "Pamiętaj o lekcji z wczoraj:",
    "calendarTitle": "Maj 2026",
    "historyTitle": "Poprzednie dni",
    "showMore": "Pokaż więcej",
    "cardCompleted": "Ukończona",
    "cardMorning": "Sesja poranna",
    "cardEmpty": "—"
  },
  "wizard": {
    "morning": {
      "sessionLabel": "Sesja poranna",
      "goTrade": "Idę tradować →",
      "stepOf": "Krok {current} z {total}",
      "steps": {
        "1": "Lekcje",
        "2": "Kontekst osobisty",
        "3": "Kontekst rynkowy",
        "4": "Plan dnia",
        "5": "Pre-mortem"
      }
    },
    "evening": {
      "sessionLabel": "Sesja wieczorna",
      "finishDay": "Zakończ dzień",
      "steps": {
        "6": "Log transakcji",
        "7": "Log emocji",
        "8": "Oceny obszarów",
        "9": "Silne strony",
        "10": "Intencja",
        "11": "Stan mentalny",
        "12": "Deliberate practice",
        "13": "Ocena dzienna",
        "14": "Tożsamość",
        "15": "Lekcja na jutro"
      }
    },
    "fields": {
      "yesterdayLesson": "LEKCJA Z WCZORAJ:",
      "lastWeekLesson": "LEKCJA Z POPRZ. TYGODNIA (Weekly Review):",
      "noLesson": "Brak lekcji — to Twój pierwszy dzień w systemie.",
      "sleep": "Sen:",
      "energy": "Energia:",
      "focus": "Fokus:",
      "prepQuality": "Jakość przygotowania:",
      "moodNotes": "Nastrój / notatki:",
      "trendBias": "Trend / bias:",
      "keyLevels": "Kluczowe poziomy:",
      "macroNews": "Makro / news:",
      "correlations": "Korelacje:",
      "whatIfs": "What-ifs (scenariusze):",
      "entryConditions": "Warunki wejścia:",
      "tierA": "Setup A (100% wielkości):",
      "tierB": "Setup B (50% wielkości):",
      "tierC": "Setup C (25% wielkości):",
      "preMortem": "Co mogę dziś zepsuć?",
      "dailyGoal": "Cel dzienny:",
      "bridgeSuggestion": "Wstaw sugestie z Weekly Review",
      "strengthsUsed": "Co wykorzystałem ze swoich silnych stron?",
      "improvementWhen": "Kiedy",
      "improvementThen": "wtedy",
      "improvementExtra": "Dodatkowe notatki:",
      "mentalAfter": "Stan mentalny po sesji:",
      "whatShapedIt": "Co na niego wpłynęło?",
      "deliberatePractice": "Co zrobiłem dla swojej przewagi poza tradingiem?",
      "processScore": "Process score (1–10):",
      "pl": "P&L:",
      "overallScore": "Ogólna ocena:",
      "proudOf": "Z czego byłby DUMNY trader, którym chcę być?",
      "ashamedOf": "Za co byłby ZAWSTYDZONY trader, którym chcę być?",
      "tomorrowRemember": "Jutro pamiętaj o:",
      "scaleAnchor": "1 = naruszenie zasad · 3 = poprawnie ale automatycznie · 5 = świadomie i zgodnie z planem",
      "areaSetups": "Setupy:",
      "areaExecution": "Egzekucja:",
      "areaRisk": "Zarządzanie ryzykiem:",
      "areaPsychology": "Psychologia:",
      "areaDiscipline": "Dyscyplina:",
      "tradeTime": "Czas",
      "tradeTrigger": "Trigger",
      "tradeSetup": "Setup",
      "tradeDirection": "Kier.",
      "tradeTier": "Tier",
      "tradeRExpected": "R plan.",
      "tradeRActual": "R real.",
      "tradeEmotion": "Emocja",
      "tradeLessons": "Lekcje",
      "addTrade": "+ Dodaj transakcję",
      "emotionTime": "Czas",
      "emotionName": "Emocja",
      "emotionTrigger": "Trigger / kontekst",
      "emotionMeaning": "Znaczenie (sygnał)",
      "emotionReaction": "Reakcja",
      "addEmotion": "+ Dodaj emocję"
    },
    "complete": {
      "title": "Dzień ukończony",
      "message": "Dobra robota. Karta dzienna zapisana.",
      "downloadPdf": "Pobierz kartę (PDF)",
      "backToDashboard": "Wróć do dashboardu"
    },
    "next": "Dalej →",
    "back": "← Wstecz",
    "save": "Zapisz"
  }
}
```

- [ ] **Step 5: Commit**

```powershell
git add i18n/ messages/ next.config.ts
git commit -m "feat: next-intl with complete Polish strings"
```

---

## Task 6: Design system tokens + Tailwind config

**Files:**
- Create: `styles/tokens.css`
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Create styles/tokens.css**

```css
/* styles/tokens.css */
:root {
  /* Colors */
  --color-dark:    #0d1f35;
  --color-mid:     #1e3a5f;
  --color-accent:  #1e3a5f;
  --color-gold:    #c9963d;
  --color-light:   #f5f6f7;
  --color-white:   #ffffff;
  --color-text:    #1a2332;
  --color-muted:   #6b7280;
  --color-border:  #d1d5db;
  --color-bg:      #f9fafb;

  /* Typography */
  --font-family:       'Inter', system-ui, -apple-system, sans-serif;
  --font-size-header:  11px;
  --font-size-label:   12px;
  --font-size-body:    13px;
  --font-size-tiny:    10px;
  --font-weight-bold:  700;
  --font-weight-medium: 500;

  /* Layout */
  --content-max-width:    700px;
  --section-header-height: 30px;
  --section-accent-stripe: 4px;
  --radius-section-header: 3px;
  --gap-between-sections:  20px;
  --pad-section-top:       12px;
  --pad-section-bottom:    12px;

  /* Transitions */
  --transition-fast: 120ms ease;
}
```

- [ ] **Step 2: Update app/globals.css to import tokens**

```css
/* app/globals.css */
@import "../styles/tokens.css";
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: var(--font-family);
  background: var(--color-bg);
  color: var(--color-text);
}
```

- [ ] **Step 3: Extend tailwind.config.ts with token references**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forge: {
          dark:    "var(--color-dark)",
          mid:     "var(--color-mid)",
          gold:    "var(--color-gold)",
          light:   "var(--color-light)",
          muted:   "var(--color-muted)",
          border:  "var(--color-border)",
          accent:  "var(--color-accent)",
        },
      },
      maxWidth: {
        content: "var(--content-max-width)",
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 4: Commit**

```powershell
git add styles/ app/globals.css tailwind.config.ts
git commit -m "feat: design system tokens (navy/gold color scheme)"
```

---

## Task 7: SectionHeader component

**Files:**
- Create: `components/forge/SectionHeader.tsx`

- [ ] **Step 1: Create SectionHeader.tsx**

```tsx
// components/forge/SectionHeader.tsx
interface SectionHeaderProps {
  number: string
  title: string
}

export function SectionHeader({ number, title }: SectionHeaderProps) {
  return (
    <div
      className="relative flex items-center rounded-sm"
      style={{
        background: "var(--color-mid)",
        height: "var(--section-header-height)",
        padding: "0 12px 0 16px",
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: "var(--section-accent-stripe)",
          background: "var(--color-gold)",
        }}
      />
      <h2
        className="uppercase tracking-wide font-bold"
        style={{
          color: "var(--color-white)",
          fontSize: "var(--font-size-header)",
          letterSpacing: "0.3px",
          margin: 0,
        }}
      >
        {number}. {title}
      </h2>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
git add components/forge/SectionHeader.tsx
git commit -m "feat: SectionHeader forge component"
```

---

## Task 8: DotRow component (full TDD — use as template for other components)

**Files:**
- Create: `__tests__/components/forge/DotRow.test.tsx`
- Create: `components/forge/DotRow.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/forge/DotRow.test.tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DotRow } from "@/components/forge/DotRow"

describe("DotRow", () => {
  it("renders label and 5 numbered options", () => {
    render(<DotRow label="Sen:" value={null} onChange={vi.fn()} />)
    expect(screen.getByText("Sen:")).toBeInTheDocument()
    expect(screen.getAllByRole("radio")).toHaveLength(5)
    ;[1, 2, 3, 4, 5].forEach((n) => {
      expect(screen.getByLabelText(String(n))).toBeInTheDocument()
    })
  })

  it("marks the current value as checked", () => {
    render(<DotRow label="Sen:" value={3} onChange={vi.fn()} />)
    expect(screen.getByLabelText("3")).toBeChecked()
    expect(screen.getByLabelText("1")).not.toBeChecked()
  })

  it("calls onChange with numeric value on click", async () => {
    const onChange = vi.fn()
    render(<DotRow label="Sen:" value={null} onChange={onChange} />)
    await userEvent.click(screen.getByLabelText("4"))
    expect(onChange).toHaveBeenCalledWith(4)
  })
})
```

- [ ] **Step 2: Run test — verify it FAILS**

```powershell
pnpm test:run __tests__/components/forge/DotRow.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/forge/DotRow'`

- [ ] **Step 3: Implement DotRow.tsx**

```tsx
// components/forge/DotRow.tsx
interface DotRowProps {
  label: string
  value: number | null
  onChange: (value: number) => void
  options?: number[]
}

export function DotRow({ label, value, onChange, options = [1, 2, 3, 4, 5] }: DotRowProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span
        className="whitespace-nowrap"
        style={{
          color: "var(--color-muted)",
          fontSize: "var(--font-size-label)",
          minWidth: "90px",
        }}
      >
        {label}
      </span>
      <div className="flex gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((n) => (
          <label
            key={n}
            className="relative flex items-center justify-center cursor-pointer"
            style={{ width: 18, height: 18 }}
          >
            <input
              type="radio"
              name={label}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              aria-label={String(n)}
              className="absolute opacity-0 w-full h-full cursor-pointer"
            />
            <span
              className="flex items-center justify-center rounded-full transition-colors"
              style={{
                width: 14,
                height: 14,
                border: `0.8px solid ${value === n ? "var(--color-accent)" : "var(--color-accent)"}`,
                background: value === n ? "var(--color-accent)" : "var(--color-white)",
                fontSize: 8,
                color: value === n ? "var(--color-white)" : "var(--color-muted)",
                fontWeight: value === n ? "var(--font-weight-bold)" : "normal",
                transition: "var(--transition-fast)",
              }}
            >
              {n}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test — verify it PASSES**

```powershell
pnpm test:run __tests__/components/forge/DotRow.test.tsx
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```powershell
git add components/forge/DotRow.tsx __tests__/components/forge/DotRow.test.tsx
git commit -m "feat: DotRow component (TDD) — 1-5 rating circles"
```

---

## Task 9: TextInput + TextArea components

**Files:**
- Create: `components/forge/TextInput.tsx`
- Create: `components/forge/TextArea.tsx`

- [ ] **Step 1: Create TextInput.tsx**

```tsx
// components/forge/TextInput.tsx
interface TextInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  placeholder?: string
}

export function TextInput({ label, value, onChange, readOnly, placeholder }: TextInputProps) {
  return (
    <label className="flex items-baseline gap-2 py-1">
      <span
        className="whitespace-nowrap"
        style={{ color: "var(--color-muted)", fontSize: "var(--font-size-label)", minWidth: "120px" }}
      >
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        className="flex-1 border-0 border-b bg-transparent outline-none px-1 py-0.5"
        style={{
          borderBottom: "0.5px solid var(--color-border)",
          fontFamily: "var(--font-family)",
          fontSize: "var(--font-size-label)",
          color: "var(--color-text)",
        }}
      />
    </label>
  )
}
```

- [ ] **Step 2: Create TextArea.tsx**

```tsx
// components/forge/TextArea.tsx
interface TextAreaProps {
  label?: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}

export function TextArea({ label, value, onChange, rows = 5, placeholder }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1 py-1">
      {label && (
        <span style={{ color: "var(--color-muted)", fontSize: "var(--font-size-label)" }}>
          {label}
        </span>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="resize-y border-none outline-none bg-transparent p-0 w-full"
        style={{
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent 19px, var(--color-border) 19px, var(--color-border) 20px)`,
          backgroundSize: "100% 20px",
          lineHeight: "20px",
          fontFamily: "var(--font-family)",
          fontSize: "var(--font-size-label)",
          color: "var(--color-text)",
          minHeight: `${rows * 20}px`,
        }}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```powershell
git add components/forge/TextInput.tsx components/forge/TextArea.tsx
git commit -m "feat: TextInput + TextArea forge components (lined paper style)"
```

---

## Task 10: GoldCircles component (overall score)

**Files:**
- Create: `components/forge/GoldCircles.tsx`
- Create: `__tests__/components/forge/GoldCircles.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// __tests__/components/forge/GoldCircles.test.tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GoldCircles } from "@/components/forge/GoldCircles"

describe("GoldCircles", () => {
  it("renders 5 circles", () => {
    render(<GoldCircles label="Ogólna ocena:" value={null} onChange={vi.fn()} />)
    expect(screen.getAllByRole("radio")).toHaveLength(5)
  })

  it("fills circles up to selected value", () => {
    render(<GoldCircles label="Ogólna ocena:" value={3} onChange={vi.fn()} />)
    const radios = screen.getAllByRole("radio")
    expect(radios[2]).toBeChecked()
  })
})
```

- [ ] **Step 2: Run — verify FAILS**

```powershell
pnpm test:run __tests__/components/forge/GoldCircles.test.tsx
```

- [ ] **Step 3: Implement GoldCircles.tsx**

```tsx
// components/forge/GoldCircles.tsx
interface GoldCirclesProps {
  label: string
  value: number | null
  onChange: (value: number) => void
}

export function GoldCircles({ label, value, onChange }: GoldCirclesProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span style={{ color: "var(--color-muted)", fontSize: "var(--font-size-label)" }}>
        {label}
      </span>
      <div className="flex gap-2" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input
              type="radio"
              name={`gold-${label}`}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              aria-label={String(n)}
              className="sr-only"
            />
            <span
              className="block rounded-full transition-all"
              style={{
                width: 22,
                height: 22,
                border: `1.5px solid var(--color-gold)`,
                background: value !== null && n <= value ? "var(--color-gold)" : "transparent",
                transition: "var(--transition-fast)",
              }}
            />
          </label>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run — verify PASSES**

```powershell
pnpm test:run __tests__/components/forge/GoldCircles.test.tsx
```

- [ ] **Step 5: Commit**

```powershell
git add components/forge/GoldCircles.tsx __tests__/components/forge/GoldCircles.test.tsx
git commit -m "feat: GoldCircles component (overall score, TDD)"
```

---

## Task 11: TableInput + ImplementationIntention + BridgeIndicator

**Files:**
- Create: `components/forge/TableInput.tsx`
- Create: `components/forge/ImplementationIntention.tsx`
- Create: `components/forge/BridgeIndicator.tsx`
- Create: `components/forge/index.ts`

- [ ] **Step 1: Create TableInput.tsx — dynamic rows with add button**

```tsx
// components/forge/TableInput.tsx
export interface Column {
  id: string
  label: string
  width?: string
  type?: "text" | "number" | "select"
  options?: string[]
}

interface TableInputProps {
  columns: Column[]
  rows: Record<string, string | number>[]
  onAddRow: () => void
  onUpdateRow: (index: number, field: string, value: string | number) => void
  addLabel?: string
  emptyRows?: number
}

export function TableInput({ columns, rows, onAddRow, onUpdateRow, addLabel = "+ Dodaj", emptyRows = 3 }: TableInputProps) {
  const displayRows = rows.length > 0 ? rows : Array(emptyRows).fill({})

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
          {displayRows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `0.5px solid var(--color-border)` }}>
              {columns.map((col) => (
                <td key={col.id} className="px-1 py-0.5">
                  {col.type === "select" && col.options ? (
                    <select
                      value={String(row[col.id] ?? "")}
                      onChange={(e) => onUpdateRow(i, col.id, e.target.value)}
                      className="w-full bg-transparent border-none outline-none"
                      style={{ fontSize: "var(--font-size-tiny)" }}
                    >
                      <option value="" />
                      {col.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={col.type ?? "text"}
                      value={String(row[col.id] ?? "")}
                      onChange={(e) => onUpdateRow(i, col.id, e.target.value)}
                      className="w-full bg-transparent border-none outline-none"
                      style={{ fontSize: "var(--font-size-tiny)" }}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 0 && (
        <button
          type="button"
          onClick={onAddRow}
          className="mt-2 text-sm"
          style={{ color: "var(--color-muted)" }}
        >
          {addLabel}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create ImplementationIntention.tsx**

```tsx
// components/forge/ImplementationIntention.tsx
interface ImplementationIntentionProps {
  whenValue: string
  thenValue: string
  extraValue: string
  onChangeWhen: (v: string) => void
  onChangeThen: (v: string) => void
  onChangeExtra: (v: string) => void
}

export function ImplementationIntention({
  whenValue, thenValue, extraValue,
  onChangeWhen, onChangeThen, onChangeExtra,
}: ImplementationIntentionProps) {
  const inputStyle = {
    flex: 1,
    borderBottom: "0.5px solid var(--color-border)",
    background: "transparent",
    outline: "none",
    fontSize: "var(--font-size-label)",
    fontFamily: "var(--font-family)",
    padding: "2px 4px",
  }

  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="flex items-baseline gap-2">
        <span style={{ color: "var(--color-muted)", fontSize: "var(--font-size-label)", whiteSpace: "nowrap" }}>Kiedy</span>
        <input type="text" value={whenValue} onChange={(e) => onChangeWhen(e.target.value)} style={inputStyle} />
        <span style={{ color: "var(--color-muted)", fontSize: "var(--font-size-label)", whiteSpace: "nowrap" }}>wtedy</span>
        <input type="text" value={thenValue} onChange={(e) => onChangeThen(e.target.value)} style={inputStyle} />
      </div>
      <textarea
        value={extraValue}
        onChange={(e) => onChangeExtra(e.target.value)}
        rows={3}
        placeholder="Dodatkowe notatki..."
        className="resize-none bg-transparent outline-none border-none w-full"
        style={{ fontSize: "var(--font-size-label)", fontFamily: "var(--font-family)" }}
      />
    </div>
  )
}
```

- [ ] **Step 3: Create BridgeIndicator.tsx**

```tsx
// components/forge/BridgeIndicator.tsx
interface BridgeIndicatorProps {
  source: string
}

export function BridgeIndicator({ source }: BridgeIndicatorProps) {
  return (
    <div className="flex items-center gap-1 mb-1">
      <span style={{ color: "var(--color-gold)", fontSize: "var(--font-size-tiny)" }}>↗</span>
      <span style={{ color: "var(--color-muted)", fontSize: "var(--font-size-tiny)", fontStyle: "italic" }}>
        {source}
      </span>
    </div>
  )
}
```

- [ ] **Step 4: Create barrel export components/forge/index.ts**

```typescript
// components/forge/index.ts
export { SectionHeader } from "./SectionHeader"
export { DotRow } from "./DotRow"
export { TextInput } from "./TextInput"
export { TextArea } from "./TextArea"
export { GoldCircles } from "./GoldCircles"
export { TableInput } from "./TableInput"
export { ImplementationIntention } from "./ImplementationIntention"
export { BridgeIndicator } from "./BridgeIndicator"
```

- [ ] **Step 5: Commit**

```powershell
git add components/forge/
git commit -m "feat: complete forge design system components (TableInput, ImplementationIntention, BridgeIndicator)"
```

---

**Part 1 complete.** Continue with `2026-05-05-phase1-part2-wizard.md`.
