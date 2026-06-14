# Day Tags — Design Spec

## Goal

Allow a trader to optionally tag completed daily cards (max 3 tags per day) from a predefined personal list. Tags appear as a dot on the calendar and aggregate in a dedicated "Tagi" tab.

## Architecture

User manages a personal list of `DayTag` records. After completing a daily card, tags are assigned on the complete page. Tags surface in two places: calendar dots and the Tagi aggregation tab.

**Tech stack:** Next.js App Router, Prisma + PostgreSQL, existing server actions pattern.

---

## 1. Data Model

Two new Prisma models:

```prisma
model DayTag {
  id        String            @id @default(cuid())
  userId    String
  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  createdAt DateTime          @default(now())
  cards     DailyCardDayTag[]
  @@unique([userId, name])
}

model DailyCardDayTag {
  dailyCardId String
  dayTagId    String
  dailyCard   DailyCard @relation(fields: [dailyCardId], references: [id], onDelete: Cascade)
  dayTag      DayTag    @relation(fields: [dayTagId], references: [id], onDelete: Cascade)
  @@id([dailyCardId, dayTagId])
}
```

`DailyCard` gains: `dayTags DailyCardDayTag[]`
`User` gains: `dayTags DayTag[]`

Relation (not `String[]` array) enables efficient aggregation query: fetch all cards for a given tag directly via `dayTag.cards`.

---

## 2. Complete Page — Tag Selector

Location: `/cards/[date]/complete` — new section at the bottom of the page.

**UI:**
- Section header: "TAGI DNIA"
- All user's tags displayed as clickable chips, sorted alphabetically
- Active chips: blue (`#4A9EE2`) background, white text
- Inactive chips: border only
- Click → immediate toggle (server action, no explicit save button)
- Max 3: once 3 selected, unselected chips are dimmed and non-clickable
- Counter: "Wybrano: 2/3" shown below chips
- If user has no tags yet: message "Brak tagów. Dodaj tagi w zakładce Tagi →" (link to `/dashboard?tab=tagi`)
- If returning to complete page: previously saved tags shown as active

---

## 3. Calendar Dot

Days with at least one tag get a dot in the top-left corner of the calendar cell.

- Color: `#4A9EE2` (blue)
- Size: 5×5px, border-radius 50%
- `box-shadow: 0 0 0 1px rgba(255,255,255,0.6)` — visible on all backgrounds including gold (MORNING/STARTED)
- Hover → tooltip with tag names: `Skupiony, FOMO`
- Tooltip: `position: absolute`, above the cell, white text on `var(--color-mid)` background, `font-size: 9px`

**Data flow:** Dashboard page fetches `dayTags` per card server-side. `CalendarView` receives new prop:
```ts
dayTags?: Record<string, string[]>  // { "2026-06-14": ["Skupiony", "FOMO"] }
```
No additional client-side requests.

Implementation note: the dot markup + tooltip pattern is identical to the macro events dot in `feature/macro-events` branch — copy from `components/dashboard/CalendarView.tsx` in that branch.

---

## 4. Tagi Tab — Dashboard

New tab: `?tab=tagi` alongside Historia / Kalibracja / Playbook.

### 4a. Main view (tag list)

- Input field + "Dodaj" button at the top
  - On submit: create new `DayTag`, name trimmed, duplicate check (shows error if already exists)
  - Empty name rejected
- Tag list sorted alphabetically
- Each row: tag name | usage count ("12 dni") | delete icon
  - Delete: confirm before removing (removing a tag also removes all `DailyCardDayTag` join records via `onDelete: Cascade`)
  - Click anywhere on row (except delete) → navigate to detail view

### 4b. Detail view

URL: `?tab=tagi&tag=<tagId>`

- Back link: "← Wszystkie tagi"
- Heading: tag name in uppercase + total count ("SKUPIONY — 12 dni")
- Table columns: Data | P&L | Proces
  - Data: formatted `DD.MM.YYYY`
  - P&L: `+€120` / `-€50`, colored green/red
  - Proces: `8/10`, no color
  - Sorted: most recent first
- Each row's date is a link → `/cards/[date]/complete`, opens in new tab (`target="_blank"`)
- If no cards yet for this tag: "Brak dni z tym tagiem."

---

## 5. Server Actions

New file: `actions/tags.ts`

```ts
getUserTags(userId): Promise<DayTag[]>
createTag(userId, name): Promise<DayTag>
deleteTag(tagId, userId): Promise<void>
setCardTags(cardId, tagIds: string[]): Promise<void>  // replaces all tags for card, validates max 3
getTagWithCards(tagId, userId): Promise<DayTag & { cards: (DailyCardDayTag & { dailyCard: DailyCard })[] }>
```

---

## 6. Default Tags (Seed Data)

When a new user first opens the Tagi tab (or on first app load for existing users with no tags), 5 default tags are created automatically:

1. Skupiony
2. Cierpliwy
3. W strefie
4. FOMO
5. Strach

Seed logic: in `getUserTags` — if the returned list is empty, create these 5 tags for the user and return them. This runs once silently, no special onboarding UI needed.

---

## 7. Out of Scope

- Tag renaming (delete + recreate)
- Tag reordering (alphabetical is fixed)
- Tags on weekly/monthly review
- Tag color customization
- Search/filter within tag detail view
