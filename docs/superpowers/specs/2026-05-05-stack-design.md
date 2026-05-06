# The Forge — Stack & Architecture Design

**Date:** 2026-05-05  
**Status:** Approved

---

## Project identity

**The Forge** — a multi-user web application porting a 5-layer trader development system (Daily → Weekly → Monthly → Quarterly → Yearly) from PDF templates to the web. Real traders are forged in fire: deliberate practice, honest reflection, identity-based growth.

This is not a trading journal in the classic sense. Trade entries are inputs; the output is transformation of the trader.

---

## Confirmed constraints

- **Multi-user:** Each user has a fully isolated private account. No visibility between users, no social features.
- **Online hosted:** Users access via browser (not local install).
- **Polish as source language:** i18n-ready for English later (`next-intl`).
- **Privacy-first:** All data stays on the user's own server. No third-party data transmission.
- **No gamification:** No streaks, leaderboards, or AI-generated content.
- **Single column ~700px:** Matches PDF design system. No multi-column desktop layouts.
- **Every design detail is intentional:** Line counts, phrasings, scale anchors — do not simplify without asking.

---

## Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack in one project; Server Actions handle bridge logic without a separate API |
| Language | TypeScript | Decided — everywhere |
| Styling | Tailwind CSS + shadcn/ui | Ready-made components matching the design system; avoids building from scratch |
| Auth | Auth.js (NextAuth v5) | Email + password out of the box; session management; 30 min to working login |
| ORM | Prisma | Same schema works for both local (SQLite dev) and hosted (PostgreSQL prod) |
| Database | PostgreSQL | Multi-user hosted; Railway plugin with automatic backups |
| PDF Export | Puppeteer | Renders completed daily card to PDF for download/print |
| i18n | next-intl | PL now, EN-ready later |
| Package manager | pnpm | Faster, stricter than npm |
| Hosting | Railway.app | ~$10/month (web service + PostgreSQL); auto-deploy on git push; no server knowledge needed |

---

## Architecture

```
Browser
  │
  ▼
Next.js 15 (App Router)
  ├── Pages (React)        — wizard, auth, dashboard, calendar, reports
  ├── Server Actions       — form saves, bridge queries, aggregations
  └── API Routes           — PDF generation (Puppeteer)
  │
  ▼
PostgreSQL (via Prisma)
  ├── users
  ├── daily_cards
  ├── trades
  ├── emotion_entries
  ├── weekly_reviews
  ├── monthly_reviews
  ├── quarterly_reviews
  ├── yearly_reviews
  └── calibration_goals
```

One project, one deployment. No separate API server.

---

## User flow

### Auth
```
/ (landing)  →  /register  →  /login  →  /dashboard
```
Minimalist landing with The Forge name and single CTA.

### Dashboard
- **Primary action:** Start today's card / Continue / Download PDF
- **Yesterday's lesson banner:** Always visible if today's morning session is complete
  ```
  📌 Pamiętaj o lekcji z wczoraj:
  "Nie wchodź w C-setup po 14:00 — trzy razy z rzędu skończyło się stratą."
  ```
  Hidden if no previous card exists (first day in system).
- **Calendar view:** Full month grid, click any day to view/edit that card
  - ✅ Completed card
  - 🌅 Morning session only (evening pending)
  - — No card (weekend, no trading)
- **History list:** Last 7–14 days with status + [Preview] [Download PDF] actions

### Daily Card — Wizard (step-by-step, one section per screen)

The daily card is split into two sessions separated by the trading day.

**Morning session (before trading):**
| Step | Content |
|---|---|
| 1 | Yesterday's lesson (read-only, auto-pulled from Bridge 1) + last week's strategic topic |
| 2 | Personal context: sleep, energy, focus, prep quality, mood notes |
| 3 | Market context: trend/bias, key levels, macro news, correlations |
| 4 | Daily plan: what-ifs, entry conditions, tier A/B/C setups |
| 5 | Pre-mortem: what mistakes am I likely to make today? (Bridge 2 items suggested here) |

After step 5: **"Idę tradować"** button → card status set to `morning`, session suspended.
User sees the yesterday's lesson banner and a "Come back this evening" screen.

**Evening session (after trading):**
| Step | Content |
|---|---|
| 6 | Trade log (table: time, trigger, setup, direction, tier, R expected, R actual, emotion, lessons) |
| 7 | Emotion log (table: time, emotion, trigger/context, meaning/signal, reaction) |
| 8 | Area scores 1–5: setups, execution, risk management, psychology, discipline (with scale anchors always visible) |
| 9 | Strengths used today |
| 10 | Implementation intention: "Kiedy ___, wtedy ___" (two-field structure — do not replace with single textarea) |
| 11 | Mental state after session (1–5) + what shaped it |
| 12 | Deliberate practice (off-session work today) |
| 13 | Daily evaluation: process score (1–10), P&L, overall score (gold circles 1–5) |
| 14 | Identity: what would the trader I want to be be PROUD of / ASHAMED of |
| 15 | Tomorrow's lesson ("Tomorrow remember") → feeds Bridge 1 |

After step 15: **"Zakończ dzień"** → card status set to `completed`, PDF generated and available.

**Auto-save after every step.** User can close browser and return to exact position.

---

## Data model

```typescript
users {
  id, email, password_hash, created_at
}

daily_cards {
  id, user_id, date
  // morning fields
  sleep, energy, focus, prep_quality, mood_notes
  trend_bias, key_levels, macro_news, correlations
  what_ifs, entry_conditions
  tier_a_setup, tier_b_setup, tier_c_setup
  pre_mortem
  yesterday_lesson   // auto-pulled: previous daily_card.tomorrow_remember
  last_week_lesson   // auto-pulled: latest weekly_review.bridge_strategic_topic
  // evening fields
  strengths_used
  improvement_when, improvement_then, improvement_extra
  mental_after (1-5), what_shaped_it
  deliberate_practice
  process_score (1-10), pl, overall_score (1-5)
  proud_of, ashamed_of
  tomorrow_remember  // → feeds next day's yesterday_lesson
  // metadata
  status: 'morning' | 'completed'
  created_at, updated_at
}

trades {
  id, daily_card_id
  time, trigger, setup, direction, tier (A|B|C)
  r_expected, r_actual, decision, emotion, lessons
}

emotion_entries {
  id, daily_card_id
  time, emotion, trigger_context, meaning_signal, reaction
}

weekly_reviews {
  id, user_id, week_start, week_end
  // auto-calculated from daily_cards
  stats_this_week (trades, win_rate, avg_r, profit_factor, best_r, worst_r, net_pl, sleep_avg)
  tier_a, tier_b, tier_c (aggregated)
  mental_state_per_day (mon–fri)
  // qualitative fields
  best_trade_why, worst_trade_what_went_wrong
  lessons (3x), gratitude
  pattern_when_strongest
  errors (1-to-many)
  identity_was / identity_was_not
  threats_map
  bridge_strategic_topic     // → feeds daily_card.last_week_lesson
  bridge_pre_mortem_items[]  // → suggested in daily pre_mortem
  practice_plan (3 tasks)
  stop_loss_threshold
  process_goal_next_week     // → feeds next weekly.last_week_goal
}

calibration_goals {
  id, user_id, layer, source_id
  goal_text, probability_assigned (0-100)
  set_at, evaluated_at
  outcome: 'achieved' | 'partial' | 'missed' | null
}
```

**Schema notes:**
- All foreign keys: cascade on delete
- All timestamps: UTC stored, user's timezone rendered
- All long text: TEXT type, no length limit
- Scale fields (1-5, 1-10): INTEGER with CHECK constraint
- Every query filters by `user_id` — complete data isolation

---

## Bridges (implemented as server-side queries)

| Bridge | Query |
|---|---|
| Bridge 1: Daily→Daily | On open: `SELECT tomorrow_remember FROM daily_cards WHERE user_id=? AND date < today ORDER BY date DESC LIMIT 1` — pulls most recent previous card, handles weekends and gaps |
| Bridge 2: Weekly→Daily | On open: `SELECT bridge_strategic_topic, bridge_pre_mortem_items FROM weekly_reviews WHERE user_id=? AND week_end < today ORDER BY week_end DESC LIMIT 1` |
| Bridge 3: Daily→Weekly | On Weekly open: aggregate trades + daily scores for the week automatically |
| Bridge 4: Weekly→Weekly | On Weekly open: pull previous week's `process_goal_next_week` and `what_i_expected` |

Bridges 1–3 are MVP. Bridges 4+ follow in later phases.

---

## PDF Export

At end of evening session, Puppeteer renders the completed daily card as a PDF:
- Same visual design as the original PDF (navy/gold color scheme, section headers, dot rows)
- Available for download from dashboard history
- Also accessible via direct URL: `/cards/[date]/pdf`
- Print stylesheet also provided (Ctrl+P works as fallback)

---

## Deployment

```
GitHub → Railway.app
  ├── Web Service (Next.js)    ~$5/month
  └── PostgreSQL plugin        ~$5/month
                               ──────────
                               ~$10/month total
```

**Local development:**
```
Node.js + pnpm
Next.js dev server → localhost:3000
PostgreSQL local   → Docker (one command)
```

**Environment variables:**
```
DATABASE_URL      — PostgreSQL connection string
NEXTAUTH_SECRET   — session encryption key
NEXTAUTH_URL      — app URL
```

---

## Build order (phases)

### Phase 1 — MVP
1. Project setup (Next.js, Prisma, Auth.js, Tailwind, shadcn/ui, next-intl)
2. Auth: register, login, logout
3. Design system: tokens.css → Tailwind config, core components (SectionHeader, DotRow, TextInput, TextArea, GoldCircles, TableInput)
4. Daily Card wizard — morning session (steps 1–5)
5. Bridge 1: yesterday's lesson auto-pull
6. Daily Card wizard — evening session (steps 6–15)
7. Bridge 2: Weekly→Daily pre-mortem suggestions
8. PDF export of completed daily card
9. Dashboard: calendar view + history list + lesson banner
10. **STOP.** User fills for 2 weeks. Real usage reveals more than additional features.

### Phase 2 — Weekly layer
11. Weekly Review with Bridge 3 (auto-aggregation from Daily Cards)
12. Bridge 4: Weekly→Weekly goal recall

### Phase 3 — Monthly + Quarterly + Yearly
13. Monthly Review + Bridges 5, 6
14. Quarterly + Yearly Reviews + Bridges 7, 8

### Phase 4 — Analytics
15. Calibration tracking dashboard (Bridge 9)
16. Stop-loss alert system (Bridge 10)
17. Identity pattern detection

### Deferred (not before Phase 4)
- Trading journal with trade import from platforms (MT4/MT5, IBKR, etc.)
  — manual entry first, observe whether import adds or removes value
- Mid-week check-in
- Body/sleep correlation analysis
- Identity question rotation

---

## What "done" (Phase 1) looks like

- [ ] User can register, log in, log out
- [ ] User fills morning Daily Card (steps 1–5) and clicks "Idę tradować"
- [ ] Yesterday's lesson appears automatically at top of next day's card
- [ ] User returns in the evening, completes card (steps 6–15)
- [ ] Completed card available as PDF download
- [ ] Dashboard shows calendar month view + history list
- [ ] Yesterday's lesson banner visible all day after morning session
- [ ] All data isolated per user — no cross-user visibility
- [ ] Runs on Railway with PostgreSQL
