# Design: Edycja ukończonych kart + Komentarz mentora

**Data:** 2026-05-06  
**Status:** Zatwierdzony

---

## Kontekst

Dwa powiązane problemy:
1. Po ukończeniu karty (status `COMPLETED`) nie można jej edytować — system blokuje dostęp przez redirect.
2. Brak możliwości dodania komentarza mentora do karty, który powinien wyświetlać się rano następnego dnia obok lekcji z poprzedniego dnia.

---

## Sekcja 1: Edycja ukończonych kart

### Problem
Obie strony wizard (`morning/[step]/page.tsx` i `evening/[step]/page.tsx`) zawierają guard:
```ts
if (card.status === "COMPLETED") redirect(`/cards/${date}/complete`)
```
To uniemożliwia powrót do edycji po ukończeniu karty.

### Rozwiązanie
Usunąć redirect `COMPLETED → /complete` z obu stron wizard. Karta pozostaje w statusie `COMPLETED` — nie cofa się do `MORNING`. Wszystkie pola są edytowalne, bo `updateDailyCard` nie sprawdza statusu przy zapisie.

**Zmiany:**
- `app/(app)/cards/[date]/morning/[step]/page.tsx` — usunąć guard COMPLETED
- `app/(app)/cards/[date]/evening/[step]/page.tsx` — usunąć guard COMPLETED
- `app/(app)/cards/[date]/complete/page.tsx` — dodać przycisk "Edytuj kartę" → `/cards/${date}/morning/1`

**Nawigacja z dashboardu:**
- Kliknięcie w COMPLETED kartę w kalendarzu → `/cards/${date}/morning/1` (już zmienione w poprzedniej sesji na `/cards/${date}/complete`, teraz pozostaje `/complete` z przyciskiem edycji)

---

## Sekcja 2: Komentarz mentora

### Schemat bazy danych
Dwa nowe pola w modelu `DailyCard`:
```prisma
mentorComment       String?   // komentarz wpisywany przez tradera po sesji z mentorem
yesterdayMentorComment String? // skopiowany z poprzedniego dnia przy tworzeniu karty
```

Nowa migracja Prisma.

### Gdzie się wpisuje
Strona `/cards/[date]/complete` — pod blokiem "Dzień ukończony", przed przyciskiem PDF:
- Textarea z labelką "Komentarz mentora"
- Przycisk "Zapisz komentarz"
- Można edytować w dowolnym momencie (strona dostępna po usunięciu guardu COMPLETED)
- Server action: `updateMentorComment(cardId, text)`

### Gdzie się wyświetla
`Step1Lesson` (poranna sesja, krok 1) — jeśli `card.yesterdayMentorComment` istnieje, renderuje oddzielny blok pod lekcją:
- Nagłówek: "KOMENTARZ MENTORA"
- Tło: ciemniejsze niż blok lekcji (np. `var(--color-light)` zamiast tła strony)
- Ten sam styl co blok lekcji, ale wizualnie odróżniony

### Bridge (automatyczne przeniesienie)
W `actions/cards.ts`, funkcja `getOrCreateDailyCard`:
```ts
// już istnieje:
const yesterdayLesson = await getYesterdayLesson(userId, date)
// dodać:
const yesterdayMentorComment = await getYesterdayMentorComment(userId, date)
```

Nowa funkcja `getYesterdayMentorComment` w `lib/bridges.ts`:
```ts
export async function getYesterdayMentorComment(userId: string, date: Date) {
  const yesterday = new Date(date)
  yesterday.setDate(yesterday.getDate() - 1)
  const card = await prisma.dailyCard.findUnique({
    where: { userId_date: { userId, date: yesterday } },
    select: { mentorComment: true },
  })
  return card?.mentorComment ?? null
}
```

Przy `upsert` karty: pole `yesterdayMentorComment` ustawiane tylko przy `create` (tak samo jak `yesterdayLesson`).

---

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `prisma/schema.prisma` | +2 pola: `mentorComment`, `yesterdayMentorComment` |
| `prisma/migrations/` | nowa migracja |
| `actions/cards.ts` | `getOrCreateDailyCard` pobiera `yesterdayMentorComment`; nowa action `updateMentorComment` |
| `lib/bridges.ts` | nowa funkcja `getYesterdayMentorComment` |
| `app/(app)/cards/[date]/morning/[step]/page.tsx` | usunąć guard COMPLETED |
| `app/(app)/cards/[date]/evening/[step]/page.tsx` | usunąć guard COMPLETED |
| `app/(app)/cards/[date]/complete/page.tsx` | formularz komentarza mentora + przycisk "Edytuj kartę" |
| `components/wizard/steps/morning/Step1Lesson.tsx` | blok `yesterdayMentorComment` |

---

## Co NIE wchodzi w zakres

- Udostępnianie karty mentorowi online (mentor wpisuje sam) — zbyt złożone, poza zakresem single-user
- Powiadomienia o nowym komentarzu
- Historia komentarzy mentora (tylko jeden na kartę)
