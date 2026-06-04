# Spec: Daily Card — Drawdown dzienny i Max ryzyko na trade

**Data:** 2026-05-19

## Cel

Dodanie dwóch pól tekstowych do Sekcji 11 ("Ocena dnia") wieczornej karty dnia, tuż pod polem P&L. Pola są wypełniane ręcznie po sesji.

## Nowe pola

| ID | Label (PL) | Typ | Pozycja |
|----|-----------|-----|---------|
| `max_daily_drawdown` | Największy dzienny drawdown: | text (wolny) | Sekcja 11, pod `pl` |
| `max_risk_per_trade` | Największe ryzyko na trade: | text (wolny) | Sekcja 11, pod `max_daily_drawdown` |

Format wartości: tekst swobodny (np. `–2.5R`, `–1.8%`, `300$` — trader decyduje).

## Układ sekcji 11 po zmianach

```
Ocena procesu (1–10):       [___]
P&L (pkt / %):              [___________]
Największy dzienny drawdown: [___________]
Największe ryzyko na trade:  [___________]
Ogólna ocena:               ● ● ● ○ ○
Jutro pamiętaj:             [textarea 4 linie]
```

## Zakres zmian

### 1. Baza danych — `prisma/schema.prisma`
Dodać do modelu `DailyCard` (sekcja `// evening`):
```prisma
maxDailyDrawdown String?
maxRiskPerTrade  String?
```
Następnie uruchomić `prisma migrate dev` i `prisma generate`.

### 2. Spec — `specs/01-daily-card.json`
Dodać dwa pola do sekcji `id: 11` po polu `pl`:
```json
{ "id": "max_daily_drawdown", "label_pl": "Największy dzienny drawdown:", "label_en": "Biggest daily drawdown:", "type": "text" },
{ "id": "max_risk_per_trade", "label_pl": "Największe ryzyko na trade:", "label_en": "Biggest risk per trade:", "type": "text" }
```

### 3. Wieczorny wizard — renderowanie
Zlokalizować krok wieczorny, który renderuje sekcję 11, i dodać dwa pola `TextInput` po polu P&L, z odpowiednimi labelami i kluczami stanu.

### 4. API — zapis wieczornej karty
Dodać `maxDailyDrawdown` i `maxRiskPerTrade` do listy pól odczytywanych z body requesta i przekazywanych do `prisma.dailyCard.update`.

## Poza zakresem (na teraz)

- PDF dzienny — pola nie będą jeszcze widoczne w eksporcie
- Widok statystyk `/statistics` — nie agregujemy tych wartości
- Weekly Review — nie pobiera tych pól jako bridge

Trader zdecyduje w przyszłości, czy chce je w tych miejscach.
