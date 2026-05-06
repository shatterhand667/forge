# Data schema

How the 5 layers connect, what data flows where, and how to design the database.

## Core entity: Trader

Single user system. Likely one row in a `users` table for now (designed for future multi-tenancy if needed).

## Entities per layer

### `daily_card`

```ts
{
  id: uuid,
  user_id: uuid,
  date: Date,
  market: string,          // optional
  session: string,         // optional (e.g., "London open", "NY session")
  yesterday_lesson: string,        // auto-pulled from previous day's `tomorrow_remember`
  last_week_lesson: string,        // auto-pulled from latest weekly_review.bridge_topic

  // Section 1: Personal context (morning)
  sleep: 1 | 2 | 3 | 4 | 5,
  energy: 1 | 2 | 3 | 4 | 5,
  focus: 1 | 2 | 3 | 4 | 5,
  prep_quality: 1 | 2 | 3 | 4 | 5,
  mood_notes: string,              // multi-line

  // Section 2: Market context
  trend_bias: string,
  key_levels: string,
  macro_news: string,
  correlations: string,

  // Section 3: Daily plan
  what_ifs: string,
  entry_conditions: string,
  tier_a_setup: string,
  tier_b_setup: string,
  tier_c_setup: string,
  pre_mortem: string,              // includes carry-over from weekly bridge
  daily_goal: string,

  // Section 4: Trades log (1-to-many)
  trades: Trade[],

  // Section 5: Emotions log (1-to-many)
  emotions: EmotionEntry[],

  // Section 6: Area scores
  scores: {
    setups: 1 | 2 | 3 | 4 | 5,
    execution: 1 | 2 | 3 | 4 | 5,
    risk_management: 1 | 2 | 3 | 4 | 5,
    psychology: 1 | 2 | 3 | 4 | 5,
    discipline: 1 | 2 | 3 | 4 | 5,
    comments: { [key: string]: string },
  },

  // Section 7: Strengths in action
  strengths_used: string,

  // Section 8: One thing to improve (implementation intention)
  improvement_when: string,
  improvement_then: string,
  improvement_extra: string,

  // Section 9: Mental state after session
  mental_after: 1 | 2 | 3 | 4 | 5,
  what_shaped_it: string,

  // Section 10: Deliberate practice (off-session)
  deliberate_practice: string,

  // Section 11: Daily evaluation
  process_score: 1 | 2 | ... | 10,
  pl: string,                      // free text "1.5R" or "+2.3%"
  overall_score: 1 | 2 | 3 | 4 | 5,
  tomorrow_remember: string,       // FEEDS NEXT DAY'S yesterday_lesson

  // Section 12: Identity questions
  proud_of: string,
  ashamed_of: string,

  created_at: timestamp,
  updated_at: timestamp,
}
```

### `Trade` (sub-entity of daily_card)

```ts
{
  id: uuid,
  daily_card_id: uuid,
  time: string,                    // HH:MM
  trigger: string,                 // what caused you to notice this setup
  setup: string,                   // setup name/description
  direction: 'long' | 'short',
  tier: 'A' | 'B' | 'C',
  r_expected: number,              // expected R-multiple
  r_actual: number,                // actual R-multiple realized
  decision: string,                // what you decided
  emotion: string,                 // emotion during trade
  lessons: string,                 // post-trade lessons
}
```

### `EmotionEntry` (sub-entity of daily_card)

```ts
{
  id: uuid,
  daily_card_id: uuid,
  time: string,                    // HH:MM
  emotion: string,                 // name of emotion
  trigger_context: string,
  meaning_signal: string,          // what is this emotion telling me?
  reaction: string,                // what did I do
}
```

### `weekly_review`

```ts
{
  id: uuid,
  user_id: uuid,
  week_number: number,
  year: number,
  week_start: Date,
  week_end: Date,

  // Title bar
  last_week_goal: string,          // copied from previous weekly's process_goal_next_week
  last_week_goal_achieved: 'yes' | 'partial' | 'no' | null,
  last_week_goal_why: string,
  what_i_expected: string,         // calibration training

  // Section 1: Weekly statistics
  // Each stats row: { trades, win_rate, avg_r, profit_factor, best_r, worst_r, max_dd, net_pl, sleep_avg }
  stats_this_week: WeeklyStats,    // AUTO-CALCULATED from this week's daily cards
  stats_last_week: WeeklyStats,    // copied from previous weekly
  stats_4week_avg: WeeklyStats,    // AUTO-CALCULATED rolling average

  // Section 2: Tier sizing
  tier_a: { trades: number, win_rate: number, avg_r: number, net_r: number, conclusion: string },
  tier_b: { ... },
  tier_c: { ... },

  // Section 3: Days of the week
  days: {
    monday: { process_score, pl_r, mental_state, observation },
    tuesday: { ... },
    // ...
  },

  // Section 4: Edge trend (4 weeks)
  // AUTO-CALCULATED from previous weekly_reviews
  edge_trend: {
    win_rate: [w_minus_4, w_minus_3, w_minus_2, last, this],
    avg_r: [...],
    profit_factor: [...],
    trends: { win_rate: 'up' | 'flat' | 'down', ... },
  },

  // Section 5: Best trade of week
  best_trade_why: string,

  // Section 6: Worst trade of week
  worst_trade_what_went_wrong: string,

  // Section 7: Three lessons
  lessons: [string, string, string],

  // Section 8: Gratitude
  gratitude: string,

  // Section 9 (page 2 starts): Pattern analysis
  pattern_when_strongest: string,

  // Section 10: Repeating errors (1-to-many)
  errors: WeeklyError[],

  // Section 11: Mental capital
  mental_state_per_day: { mon, tue, wed, thu, fri: 1-5 },
  renewed_me: string,
  drained_me: string,

  // Section 12: Identity check
  identity_was_that_trader: string,
  identity_was_not_that_trader: string,

  // Section 13: Threats map for next week
  threats_map: string,

  // Section 14: Bridge to Daily (THE KEY BRIDGE MECHANISM)
  bridge_strategic_topic: string,           // FEEDS DAILY CARD last_week_lesson
  bridge_pre_mortem_items: [string, string, string],   // FEEDS DAILY CARD pre_mortem each day

  // Section 15: Deliberate practice
  last_week_practice_completed: number,     // 0-3
  last_week_practice_what_went_wrong: string,
  practice_plan: PracticeTask[],            // 3 tasks with priority MUST/SHOULD
  practice_meta: string,                    // were the planned tasks the right ones?

  // Section 16: Mentor / stop-loss / system check / goal
  mentor_topic: string,
  stop_loss_threshold: string,              // "mental state ≤2 for 3 days OR -5R in week"
  system_check: string,
  process_goal_next_week: string,           // FEEDS NEXT WEEKLY's last_week_goal

  created_at, updated_at,
}
```

### `monthly_review`, `quarterly_review`, `yearly_review`

Same pattern. See `specs/03-monthly-review.json`, `specs/04-quarterly-review.json`, `specs/05-yearly-review.json` for full structures.

## Critical bridges (data flow)

### Daily ↔ Daily

```
daily_card[N].tomorrow_remember  →  daily_card[N+1].yesterday_lesson
```
Auto-pulled when opening Daily Card for day N+1.

### Weekly ↔ Daily (the crucial bridge)

```
weekly_review.bridge_strategic_topic        →  daily_card[N..N+4].last_week_lesson
weekly_review.bridge_pre_mortem_items[]     →  daily_card[N..N+4].pre_mortem (suggested prefill)
```
When opening Daily Card on Monday, the Weekly Review's bridge content auto-populates the relevant Daily fields.

### Daily → Weekly (auto-aggregation)

```
sum(daily_card[Mon..Fri].trades.length)               →  weekly_review.stats_this_week.trades
avg(daily_card[Mon..Fri].mental_after)                →  weekly_review.mental_state_per_day
group_by(tier).avg(r_actual)                          →  weekly_review.tier_a/b/c
```
Weekly Review opens with these auto-calculated. Trader reviews and adds qualitative reflection.

### Weekly → Weekly

```
weekly_review[N].process_goal_next_week  →  weekly_review[N+1].last_week_goal
weekly_review[N].what_i_expected         →  weekly_review[N+1].what_i_expected_outcome (compare)
```

### Weekly → Monthly

```
4 weekly_reviews aggregated  →  monthly_review.stats
weekly_review.tier_decisions →  monthly_review.tier_decisions_implemented?
```

### Monthly → Quarterly

```
3 monthly_reviews aggregated  →  quarterly_review.hard_data
monthly_review.identity_evolution patterns  →  quarterly_review.identity_audit (with manual reflection)
```

### Quarterly → Yearly

```
4 quarterly_reviews aggregated  →  yearly_review.hard_data + edge trend
quarterly_review.letter_to_self  →  next quarterly_review header (display)
yearly_review.letter_to_self     →  next yearly_review header (display)
```

## Calibration tracking

Across all layers, each goal has:
- `goal_text`
- `probability_assigned` (0-100%)
- `outcome` (filled at next review): `achieved` | `partial` | `missed`

Tracking table:

```ts
{
  id: uuid,
  user_id: uuid,
  layer: 'weekly' | 'monthly' | 'quarterly' | 'yearly',
  source_id: uuid,                         // link to weekly_review / monthly_review / etc.
  goal_text: string,
  probability_assigned: number,            // 0-100
  set_at: Date,
  evaluated_at: Date,
  outcome: 'achieved' | 'partial' | 'missed' | null,
}
```

After 30+ goals, app can show: "your calibration accuracy: 73%". Profound feedback.

## Database choice

For local single-user: **SQLite** via Prisma is ideal. No server needed.

For self-hosted personal server: **Postgres** + Prisma. Same schema works.

Avoid:
- Firebase (data sovereignty issues for intimate work)
- Any cloud DB the trader doesn't own

## Schema notes

- All foreign keys: cascade on delete (if trader deletes a daily card, its trades and emotions go too)
- All timestamps: store as UTC, render in trader's timezone
- All long text fields: TEXT type (not VARCHAR), no length limit
- All scale fields (1-5, 1-10): INTEGER with CHECK constraint
- `JSONB` for `comments` map and similar flexible fields (Postgres) or TEXT with JSON parsing (SQLite)

## Migration strategy

Build the schema for SQLite first. Use Prisma — it supports both SQLite and Postgres with the same schema. When trader wants to deploy to server, switch the connection string.
