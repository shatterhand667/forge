# Daily Card — Drawdown i Max Ryzyko Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać dwa pola tekstowe (`maxDailyDrawdown`, `maxRiskPerTrade`) do Sekcji 11 (Step 13) wieczornej karty dnia, tuż pod polem P&L.

**Architecture:** Nowe pola w modelu `DailyCard` w Prisma, dodane do typu `Partial` w `updateDailyCard`, wyrenderowane jako `TextInput` w `Step13Evaluation`.

**Tech Stack:** Next.js App Router, Prisma + PostgreSQL, TypeScript, Server Actions

---

### Task 1: Prisma — dodaj pola do modelu DailyCard

**Files:**
- Modify: `prisma/schema.prisma` (model `DailyCard`, sekcja `// evening`)

- [ ] **Krok 1: Dodaj dwa pola do schematu**

W `prisma/schema.prisma`, w modelu `DailyCard`, po linii `pl String?` (sekcja `// evening`) dodaj:

```prisma
maxDailyDrawdown String?
maxRiskPerTrade  String?
```

- [ ] **Krok 2: Uruchom migrację**

```bash
npx prisma migrate dev --name add_drawdown_max_risk
```

Oczekiwany wynik: `Your database is now in sync with your schema.`

- [ ] **Krok 3: Zregeneruj klienta Prisma**

```bash
npx prisma generate
```

Oczekiwany wynik: `Generated Prisma Client`.

- [ ] **Krok 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add maxDailyDrawdown and maxRiskPerTrade to DailyCard schema"
```

---

### Task 2: Server Action — dodaj pola do updateDailyCard

**Files:**
- Modify: `actions/cards.ts` (funkcja `updateDailyCard`, typ `Partial`)

- [ ] **Krok 1: Dodaj pola do typu Partial**

W `actions/cards.ts`, w typie `Partial<{...}>` funkcji `updateDailyCard`, po linii `processScore: number; pl: string; overallScore: number` dodaj:

```typescript
maxDailyDrawdown: string; maxRiskPerTrade: string
```

Pełny blok po zmianie (linia ~45):
```typescript
    processScore: number; pl: string; overallScore: number
    maxDailyDrawdown: string; maxRiskPerTrade: string
    proudOf: string; ashamedOf: string; tomorrowRemember: string; todayInOneSentence: string
```

- [ ] **Krok 2: Sprawdź kompilację TypeScript**

```bash
npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Krok 3: Commit**

```bash
git add actions/cards.ts
git commit -m "feat: expose maxDailyDrawdown and maxRiskPerTrade in updateDailyCard action"
```

---

### Task 3: UI — dodaj pola w Step13Evaluation

**Files:**
- Modify: `components/wizard/steps/evening/Step13Evaluation.tsx`

- [ ] **Krok 1: Dodaj state dla nowych pól**

Po linii `const [pl, setPl] = useState(card.pl ?? "")` dodaj:

```typescript
const [maxDailyDrawdown, setMaxDailyDrawdown] = useState(card.maxDailyDrawdown ?? "")
const [maxRiskPerTrade, setMaxRiskPerTrade] = useState(card.maxRiskPerTrade ?? "")
```

- [ ] **Krok 2: Dodaj pola do handleNext**

W funkcji `handleNext`, rozszerz obiekt przekazywany do `updateDailyCard`:

```typescript
await updateDailyCard(card.id, {
  processScore: processScore ?? undefined,
  pl,
  maxDailyDrawdown,
  maxRiskPerTrade,
  overallScore: overallScore ?? undefined,
})
```

- [ ] **Krok 3: Dodaj TextInput w JSX**

Po linii:
```tsx
<TextInput label="P&L:" value={pl} onChange={setPl} placeholder="np. +1.5R lub -250 PLN" />
```

dodaj:
```tsx
<TextInput label="Największy drawdown:" value={maxDailyDrawdown} onChange={setMaxDailyDrawdown} placeholder="np. –2.5R lub –1.8%" />
<TextInput label="Max ryzyko na trade:" value={maxRiskPerTrade} onChange={setMaxRiskPerTrade} placeholder="np. 1.0R lub 0.5%" />
```

- [ ] **Krok 4: Sprawdź kompilację TypeScript**

```bash
npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Krok 5: Commit**

```bash
git add components/wizard/steps/evening/Step13Evaluation.tsx
git commit -m "feat: add maxDailyDrawdown and maxRiskPerTrade fields to Step13 evening wizard"
```

---

### Task 4: Spec — zaktualizuj 01-daily-card.json

**Files:**
- Modify: `specs/01-daily-card.json` (sekcja `id: 11`)

- [ ] **Krok 1: Dodaj pola do sekcji 11**

W `specs/01-daily-card.json`, w sekcji `"id": 11`, po elemencie z `"id": "pl"` dodaj:

```json
{ "id": "max_daily_drawdown", "label_pl": "Największy dzienny drawdown:", "label_en": "Biggest daily drawdown:", "type": "text" },
{ "id": "max_risk_per_trade", "label_pl": "Największe ryzyko na trade:", "label_en": "Biggest risk per trade:", "type": "text" },
```

- [ ] **Krok 2: Commit**

```bash
git add specs/01-daily-card.json
git commit -m "docs: add max_daily_drawdown and max_risk_per_trade to daily card spec section 11"
```

---

### Task 5: Weryfikacja manualna

- [ ] **Krok 1: Uruchom aplikację**

```bash
npm run dev
```

- [ ] **Krok 2: Przejdź do wieczornej karty, krok 13**

Nawiguj do `/cards/<dzisiejsza-data>/evening/13`. Sprawdź, że pod polem P&L widoczne są dwa nowe pola: "Największy drawdown:" i "Max ryzyko na trade:".

- [ ] **Krok 3: Wypełnij i zapisz**

Wpisz przykładowe wartości, kliknij "Dalej →". Wróć na krok 13 — wartości powinny być zachowane.

- [ ] **Krok 4: Sprawdź w bazie (opcjonalnie)**

```bash
npx prisma studio
```

Otwórz tabelę `DailyCard`, sprawdź kolumny `maxDailyDrawdown` i `maxRiskPerTrade`.
