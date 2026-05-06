# Design: Table UX + R inputs bug + "Dziś w jednym zdaniu"

**Data:** 2026-05-07  
**Status:** Zatwierdzony

---

## Kontekst

Trzy powiązane problemy z sesjami wieczornymi:
1. Tabele w sekcji 5 (Log transakcji) i 6 (Log emocji) są ciasne — kolumny tekstowe za wąskie na sensowny wpis
2. `input[type=number]` w kolumnach R plan. / R real. jest de facto nieklikalne przez wbudowane spinner arrows na wąskiej kolumnie (9% ≈ 63px)
3. Pole "Dziś w jednym zdaniu" (z specyfikacji daily card) nie istnieje w aplikacji

---

## Sekcja 1: Textarea w tabeli + fix R inputs

### Problem
`TableInput` używa `<input type="text">` dla wszystkich kolumn tekstowych. Na 700px max-width kolumna "Lekcje" (18%) = ~126px, co jest za wąskie na jedno zdanie. Kolumny R plan./R real. (9% = ~63px) są blokowane przez spinnery `input[type=number]`.

### Rozwiązanie

**Nowy typ kolumny `"textarea"` w `TableInput`:**
- `Column.type` rozszerzone o `"textarea"`
- Gdy typ = `"textarea"`, renderuje `<textarea>` zamiast `<input>`
- Textarea startuje z `rows={1}`, rośnie automatycznie przez `onInput` ustawiający `style.height = scrollHeight + "px"`
- Style: `resize: none`, `overflow: hidden`, `line-height: 1.4`, `padding: 4px`

**Kolumny zmienione na `"textarea"` w `Step6TradeLog`:**
- `trigger`, `setup`, `emotion`, `lessons`

**Kolumny zmienione na `"textarea"` w `Step7EmotionLog`:**
- `triggerContext`, `meaningSignal`, `reaction`

**Fix R plan./R real.:**
- W `TableInput`: dla `type="number"` dodać CSS `appearance: "textfield"` (usuwa spinnery cross-browser)
- W `Step6TradeLog`: kolumny `rExpected` i `rActual` poszerzyć z `"9%"` do `"10%"`

### Pliki
| Plik | Zmiana |
|------|--------|
| `components/forge/TableInput.tsx` | nowy type `"textarea"`, auto-grow, fix appearance dla number |
| `components/wizard/steps/evening/Step6TradeLog.tsx` | zmiana typów kolumn + szerokości R |
| `components/wizard/steps/evening/Step7EmotionLog.tsx` | zmiana typów kolumn |

---

## Sekcja 2: "Dziś w jednym zdaniu"

### Problem
Pole `today_in_one_sentence` ze specyfikacji daily card (title_bar.right_fields_page_2) nie istnieje w aplikacji.

### Rozwiązanie

**Schemat:** nowe pole `todayInOneSentence String?` w modelu `DailyCard`. Nowa migracja Prisma.

**UI:** Step 15 (Tomorrow) — pierwsze pole kroku, przed "Jutro pamiętaj":
```
DZIŚ W JEDNYM ZDANIU:
[______________________________________________________]
```
Renderowane jako `<TextInput>` (istniejący komponent z `@/components/forge`). Obie wartości (`todayInOneSentence` i `tomorrowRemember`) zapisują się razem w `handleFinish` przez `updateDailyCard`.

**Typ `updateDailyCard`:** dodać `todayInOneSentence: string` do Partial.

### Pliki
| Plik | Zmiana |
|------|--------|
| `prisma/schema.prisma` | `todayInOneSentence String?` |
| `prisma/migrations/` | nowa migracja |
| `actions/cards.ts` | `todayInOneSentence` w Partial `updateDailyCard` |
| `components/wizard/steps/evening/Step15Tomorrow.tsx` | nowe pole na górze |

---

## Co NIE wchodzi w zakres

- `one_thing_surprised` (druga pole z title_bar page 2) — poza zakresem tej sesji
- Przeprojektowanie tabeli na karty/accordion — wykluczone, user wybrał opcję A
- Dodatkowe kolumny ani pola poza wymienionymi
