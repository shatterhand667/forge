# Body Aggregation — Design Spec

**Data:** 2026-05-23  
**Status:** Zatwierdzony przez użytkownika  

---

## Cel

Automatyczny wskaźnik gotowości biologicznej tradera, obliczany na podstawie ocen Sen i Energia z Sekcji 1 Daily Card. Pojawia się natychmiast po wypełnieniu obu pól — zanim trader przejdzie do planowania sesji. Realizuje zasadę pre-commitment (Tendler): decyzja o ograniczeniu ryzyka zapada rano, nie w środku sesji.

---

## Lokalizacja

**Step 2 — Personal Context** (`components/wizard/steps/morning/Step2PersonalContext.tsx`)

Kolejność elementów w sekcji:
1. DotRow: Sen
2. DotRow: Energia
3. DotRow: Fokus
4. DotRow: Jakość przygotowania
5. **[NOWE] Body Aggregation row**
6. TextArea: Nastrój / notatki

---

## Obliczenie

```
bodyScore = sleep + energy
```

- Oba pola w skali 1–10, maksimum łączne: 20
- Wskaźnik pojawia się **tylko gdy oba pola mają wartość** (sleep != null && energy != null)
- Reaktywny — aktualizuje się na żywo gdy trader klika kropki Sen lub Energia
- Brak zmian w schemacie bazy danych — wartość nigdy nie jest persystowana

---

## Strefy i wizualizacja

| Wynik | Strefa | Kolor kropek | Tekst pod wskaźnikiem |
|-------|--------|-------------|----------------------|
| ≤ 7 | Stop | Czerwony `#CC3333` | "Dziś nie tradujesz" |
| 8–14 | Ostrożność | Pomarańczowy `#E07B2A` | "Dziś ryzyko max. 50%" |
| 15–20 | Gotowość | Zielony `#3D9B47` | "Jesteś gotowy" |

---

## Komponent wizualny

**Format:** Read-only wariant `ScoreDots` (już istnieje w `WeeklyStep10Practice.tsx`).

- 3 kółka tej samej wielkości co istniejące DotRow (14px średnica)
- Wypełnione kółka w kolorze strefy; niewypełnione szare (`#CCCCCC`)
- Wypełnienie kumulatywne: strefa 1 = 1 kółko, strefa 2 = 2 kółka, strefa 3 = 3 kółka
- Brak interakcji (`onClick` undefined — read-only)

**Układ wiersza:**
```
[Label "Body:"] [ⓘ tooltip] [● ● ○]
                              Dziś ryzyko max. 50%
```

- Label wyrównany z pozostałymi DotRow (`labelWidth="170px"`)
- Tekst stanu: `font-size-tiny`, kolor strefy, `font-style: italic`
- Tooltip (ⓘ): hover, pozycjonowany nad ikonką

**Tekst tooltipa:**
> "Suma ocen Sen + Energia (maks. 20). Wskaźnik gotowości biologicznej. ≤7 = układ nerwowy nie uniesie stresu dużych pozycji. 8–14 = graj ostrożnie, max połowa ryzyka. 15–20 = pełna gotowość."

---

## Implementacja

### Zmiany w plikach

**`components/wizard/steps/morning/Step2PersonalContext.tsx`** — jedyny plik do modyfikacji:

1. Wyekstrahować lub zinline'ować `ReadOnlyScoreDots` — read-only wariant `ScoreDots` z `WeeklyStep10Practice.tsx` (ten sam kształt, bez `onClick`)
2. Obliczyć `bodyScore` i `bodyZone` z istniejących stanów `sleep` i `energy`
3. Wyrenderować wiersz Body Aggregation między "Jakość przygotowania" a "Nastrój / notatki"

### Logika stref

```typescript
function getBodyZone(score: number): { zone: 1 | 2 | 3; color: string; text: string } {
  if (score <= 7)  return { zone: 1, color: "#CC3333", text: "Dziś nie tradujesz" }
  if (score <= 14) return { zone: 2, color: "#E07B2A", text: "Dziś ryzyko max. 50%" }
  return           { zone: 3, color: "#3D9B47", text: "Jesteś gotowy" }
}
```

### Warunek renderowania

```typescript
const bodyScore = (sleep != null && energy != null) ? sleep + energy : null
```

Komponent renderuje się tylko gdy `bodyScore !== null`.

---

## Czego NIE robimy

- Brak zmian w schemacie Prisma — wynik nie jest persystowany
- Brak hard-blocku Tier A — to ostrzeżenie, nie blokada (decyzja: zostawić do ewentualnej v2)
- Brak pojawienia się w Step 3 (Plan sesji) — użytkownik zdecydował: tylko Step 2
- Brak alertu w dzienniku transakcji przy wyborze Tier A

---

## Przyszłe rozszerzenia (poza scopem)

- Hard-stop Tier A gdy `bodyScore ≤ 7` (zablokowanie opcji w Step 6 trade log)
- Korelacja historyczna: czy niski Body Score w danym dniu koreluje z gorszymi wynikami?
- Uwzględnienie Fokus i Jakość przygotowania w obliczeniu (wymaga nowych progów)
