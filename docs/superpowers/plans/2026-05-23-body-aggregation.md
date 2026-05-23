# Body Aggregation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać read-only wskaźnik Body Aggregation (Sen + Energia) w Step 2 Daily Card, wyświetlający strefę gotowości biologicznej tradera jako 3 kolorowe kropki + tekst.

**Architecture:** Czysto display — zero zmian schematu. Logika `getBodyZone` jako czysta funkcja (testowalny unit), `ReadOnlyScoreDots` jako inline komponent, renderowane reaktywnie z istniejących stanów `sleep` i `energy`.

**Tech Stack:** React (useState), TypeScript, CSS-in-JS (inline styles zgodnie z wzorcem projektu), Vitest

---

### Task 1: Testy jednostkowe dla `getBodyZone`

**Files:**
- Create: `__tests__/lib/body-aggregation.test.ts`

- [ ] **Step 1: Napisz testy**

```typescript
// __tests__/lib/body-aggregation.test.ts
import { describe, it, expect } from "vitest"

function getBodyZone(score: number): { zone: 1 | 2 | 3; color: string; text: string } {
  if (score <= 7)  return { zone: 1, color: "#CC3333", text: "Dziś nie tradujesz" }
  if (score <= 14) return { zone: 2, color: "#E07B2A", text: "Dziś ryzyko max. 50%" }
  return           { zone: 3, color: "#3D9B47", text: "Jesteś gotowy" }
}

describe("getBodyZone", () => {
  it("strefa 1 dla wyniku 1", () => {
    expect(getBodyZone(1)).toMatchObject({ zone: 1, text: "Dziś nie tradujesz" })
  })
  it("strefa 1 dla wyniku 7 (granica)", () => {
    expect(getBodyZone(7)).toMatchObject({ zone: 1, color: "#CC3333" })
  })
  it("strefa 2 dla wyniku 8 (granica)", () => {
    expect(getBodyZone(8)).toMatchObject({ zone: 2, color: "#E07B2A" })
  })
  it("strefa 2 dla wyniku 14 (granica)", () => {
    expect(getBodyZone(14)).toMatchObject({ zone: 2, text: "Dziś ryzyko max. 50%" })
  })
  it("strefa 3 dla wyniku 15 (granica)", () => {
    expect(getBodyZone(15)).toMatchObject({ zone: 3, color: "#3D9B47" })
  })
  it("strefa 3 dla wyniku 20 (maksimum)", () => {
    expect(getBodyZone(20)).toMatchObject({ zone: 3, text: "Jesteś gotowy" })
  })
})
```

- [ ] **Step 2: Uruchom testy — oczekiwane FAIL**

```bash
npx vitest run __tests__/lib/body-aggregation.test.ts
```

Oczekiwane: `getBodyZone is not defined` lub podobny błąd.

- [ ] **Step 3: Commit testu**

```bash
git add __tests__/lib/body-aggregation.test.ts
git commit -m "test: add getBodyZone unit tests"
```

---

### Task 2: Implementacja Body Aggregation w Step2PersonalContext

**Files:**
- Modify: `components/wizard/steps/morning/Step2PersonalContext.tsx`

- [ ] **Step 1: Dodaj `getBodyZone` i `ReadOnlyScoreDots` do pliku**

Dodaj po imporcie `DotRow`, przed funkcją `Step2PersonalContext`:

```typescript
function getBodyZone(score: number): { zone: 1 | 2 | 3; color: string; text: string } {
  if (score <= 7)  return { zone: 1, color: "#CC3333", text: "Dziś nie tradujesz" }
  if (score <= 14) return { zone: 2, color: "#E07B2A", text: "Dziś ryzyko max. 50%" }
  return           { zone: 3, color: "#3D9B47", text: "Jesteś gotowy" }
}

function ReadOnlyScoreDots({ zone, color }: { zone: 1 | 2 | 3; color: string }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {[1, 2, 3].map(n => {
        const filled = zone >= n
        return (
          <span
            key={n}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              border: `1.5px solid ${filled ? color : "#CCCCCC"}`,
              background: filled ? color : "transparent",
              display: "inline-block",
              transition: "all 150ms ease",
            }}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Dodaj wiersz Body Aggregation do JSX**

W `Step2PersonalContext`, po DotRow "Jakość przygotowania" a przed `<TextArea label="Nastrój / notatki:"`:

```typescript
const bodyScore = (sleep != null && energy != null) ? sleep + energy : null
const bodyZone = bodyScore !== null ? getBodyZone(bodyScore) : null
```

Umieść obliczenie `bodyScore` i `bodyZone` bezpośrednio przed `return` (lub na początku ciała funkcji, po istniejących stanach).

Następnie w JSX, między ostatnim DotRow a TextArea:

```tsx
{bodyZone && (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 4 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{
        color: "var(--color-muted)",
        fontSize: "var(--font-size-label)",
        minWidth: "170px",
        maxWidth: "170px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        Body:
      </span>
      <ReadOnlyScoreDots zone={bodyZone.zone} color={bodyZone.color} />
      <div style={{ position: "relative", display: "inline-flex" }} className="group">
        <span style={{ fontSize: 10, color: "var(--color-muted)", cursor: "default", userSelect: "none" }}>ⓘ</span>
        <div className="group-hover:block hidden" style={{
          position: "absolute",
          bottom: "calc(100% + 6px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--color-dark)",
          color: "var(--color-white)",
          fontSize: "var(--font-size-tiny)",
          padding: "6px 10px",
          borderRadius: 4,
          width: 220,
          zIndex: 10,
          lineHeight: 1.5,
          pointerEvents: "none",
        }}>
          Suma ocen Sen + Energia (maks. 20). Wskaźnik gotowości biologicznej. ≤7 = układ nerwowy nie uniesie stresu dużych pozycji. 8–14 = ogranicz ryzyko. 15–20 = pełna gotowość.
        </div>
      </div>
    </div>
    <span style={{
      fontSize: "var(--font-size-tiny)",
      color: bodyZone.color,
      fontStyle: "italic",
      paddingLeft: "170px",
    }}>
      {bodyZone.text}
    </span>
  </div>
)}
```

- [ ] **Step 3: Uruchom testy — oczekiwane PASS**

```bash
npx vitest run __tests__/lib/body-aggregation.test.ts
```

Oczekiwane: 6 testów PASS (funkcja `getBodyZone` jest teraz zdefiniowana w komponencie — dla celów testu musi być wyeksportowana lub skopiowana do testu; patrz nota poniżej).

> **Nota:** `getBodyZone` jest zdefiniowana w pliku komponentu (nie eksportowana). Testy mają własną kopię funkcji (zgodnie z planem Task 1) — testują logikę, nie import. To akceptowalne dla czystej funkcji tej wielkości.

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Oczekiwane: brak błędów.

- [ ] **Step 5: Commit**

```bash
git add components/wizard/steps/morning/Step2PersonalContext.tsx
git commit -m "feat: add Body Aggregation indicator to Daily Card Step 2"
```

---

### Task 3: Push i aktualizacja memory

- [ ] **Step 1: Push**

```bash
git push
```

- [ ] **Step 2: Zaktualizuj memory** (`project_features_built.md`) — dodaj wpis o Body Aggregation pod sekcją Daily Card.
