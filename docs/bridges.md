# Bridges between layers

This is the **most important document for the web port**. Without proper bridges, the app is just a worse PDF. With bridges, it's a learning system.

## Bridge 1: Daily → Daily

**What**: Yesterday's "Tomorrow remember" appears at top of today's Daily Card.

**Implementation**:
- When user opens Daily Card for date D, fetch `daily_card` where `date = D - 1 day`
- Display its `tomorrow_remember` field at top of new card (read-only)
- If no previous card exists, show empty placeholder

**UI placement**: Title bar of Daily Card, right side, top field "LEKCJA Z WCZORAJ".

**Why it matters**: Without this, daily reflection is amnesiac. With it, identity-based habits compound.

## Bridge 2: Weekly → Daily (THE CRUCIAL BRIDGE)

**What**: Latest Weekly Review's strategic focus + 3 pre-mortem carry-over items appear in every Daily Card of the new week.

**Implementation**:
- When user opens Daily Card for date D, find latest `weekly_review` where `week_end < D`
- Display `bridge_strategic_topic` in Daily Card title bar (right side, bottom field)
- When user fills the `pre_mortem` field in Daily section 3, **suggest** the 3 items from `bridge_pre_mortem_items[]` as a starting point (e.g., as preset chips or pre-filled text)

**UI**:
- Title bar bottom field: "LEKCJA Z POPRZ. TYGODNIA (Weekly Review):"
- Pre-mortem field in Daily plan: optional "Use bridge items from Weekly Review" button that pre-fills the 3 items

**Why it matters**: Without this, Weekly Review becomes "the last ritual of the week" that's forgotten by Tuesday. With it, the weekly strategic decision **lives** in every daily card of the next week.

## Bridge 3: Daily → Weekly (auto-aggregation)

**What**: When Weekly Review is opened, it auto-fills statistics from the 5 Daily Cards of that week.

**Implementation**:
- When user opens Weekly Review for week W, fetch all `daily_card` where `date BETWEEN week_start AND week_end`
- Calculate:
  - `stats_this_week.trades` = count of all trades across cards
  - `stats_this_week.win_rate` = trades where r_actual > 0 / trades total
  - `stats_this_week.avg_r` = mean of r_actual
  - `stats_this_week.profit_factor` = sum(positive R) / abs(sum(negative R))
  - `stats_this_week.best_r`, `worst_r`, `max_dd`, `net_pl`, `sleep_avg`
- Pre-fill `mental_state_per_day` from `daily_card.mental_after`
- Pre-fill `days[]` table with `process_score`, `pl`, `mental_state` per day
- Calculate `tier_a/b/c` aggregations

**UI**:
- These fields are visible at top of Weekly Review with a subtle "auto-calculated" indicator
- User can override (sometimes manual context is needed) but defaults are calculated
- Statistics are not editable in normal flow, but accessible

**Why it matters**: Without auto-aggregation, the trader spends 30min copying numbers from Daily Cards. With it, they spend that 30min on **reflection**, which is what Weekly Review is for.

## Bridge 4: Weekly → Weekly

**What**: Each Weekly Review references previous Weekly Review for goal recall and calibration.

**Implementation**:
- When user opens Weekly Review for week W, fetch latest weekly_review where `week_number < W`
- Pre-fill (read-only):
  - `last_week_goal` from previous `process_goal_next_week`
  - Display previous `what_i_expected` for calibration comparison
- After user fills `last_week_goal_achieved`, store this and calculate calibration score

**UI**:
- Title bar shows "Last week's goal" with the actual text + radio buttons for ACHIEVED / PARTIAL / NOT
- "What did I expect from this week" field with previous week's expectation visible above

## Bridge 5: Weekly → Monthly

**What**: Monthly Review aggregates 4 Weekly Reviews + tracks if weekly tier decisions were implemented.

**Implementation**:
- When opening Monthly Review for month M, fetch all `weekly_review` where week_end is in month M
- Auto-calculate stats from those 4 weeklies
- Display each Weekly's `tier_a/b/c.conclusion` field as checkable list: "did you implement this?"
- Track `tier_decisions_implemented` per tier (yes/no/partial)

**UI**:
- Section 3 of Monthly: tier sizing aggregation table with extra column "Decisions implemented?"
- Visible reminder of what each weekly recommended

## Bridge 6: Monthly → Daily

**What**: Monthly's selected error to eliminate becomes a focus point in upcoming Daily Cards.

**Implementation**:
- Monthly Review section 6 picks ONE error with a 4-week elimination plan
- Store `eliminated_error` with `start_date` and `end_date` (4 weeks)
- During those 4 weeks, every Daily Card pre-mortem section shows this error as a callout: "Currently working on eliminating: [error]. Today's plan: [from week N of plan]"

**UI**:
- A subtle banner in Daily Card section 3 (Daily plan) when an active elimination is running
- Displays current week's role: "WEEK 1: OBSERVE" / "WEEK 2: ALARM" / etc.

**Why it matters**: Without this, the Monthly elimination plan is theoretical. With it, the trader is reminded daily that they're actively eliminating a specific error.

## Bridge 7: Monthly → Quarterly + Yearly

**What**: Identity evolution patterns from monthly reviews become inputs to quarterly identity audit and yearly review.

**Implementation**:
- When opening Quarterly Review for quarter Q, fetch all `monthly_review` in that quarter
- Display (in a sidebar or expandable section) all `identity_evolution` fields from those 3 monthlies
- Trader uses this as raw material for quarterly audit's "3 behaviors I have adopted, 3 I have let go"

**UI**:
- Quarterly Review section 3: sidebar with monthly identity evolution snippets
- "Pull from monthlies" helper button

## Bridge 8: Yearly → all (identity statement context)

**What**: Yearly identity statement appears as ambient context throughout the year.

**Implementation**:
- Latest Yearly Review's `identity_statement` displays as a small footer/sidebar in all Daily / Weekly / Monthly / Quarterly forms
- Subtle, not intrusive — like a north star

**UI**:
- Footer text in all forms: "Identity statement [year]: [text]" in small muted font

**Why it matters**: Without this, yearly reflection is filed and forgotten. With it, the yearly identity becomes living context.

## Bridge 9: Calibration tracking (cross-layer)

**What**: Every goal across all layers tracks predicted probability vs outcome.

**Implementation**:
- When goal is set: store `probability_assigned` (0-100%)
- When next review opens, prompt: "did you achieve [previous goal]? yes/partial/no"
- Calculate calibration score: % of goals where probability and outcome aligned
- Display calibration trend over time

**UI**:
- A `/calibration` page showing:
  - Current calibration accuracy
  - Trend over time (chart)
  - Detection of bias: "you're 23% overconfident on weekly goals"
- Each goal field has a "% probability" slider next to it

**Why it matters**: This is **meta-skill development**. Tetlock-style calibration over years is one of the rarest professional traits. The system makes it visible.

## Bridge 10: Stop-loss alert

**What**: When Weekly Review's stop-loss threshold is crossed, app alerts user.

**Implementation**:
- Each Weekly Review section 16 stores `stop_loss_threshold` (free text, but with structured input encouraged)
- Parse threshold into rules: `mental_state_below: number, days: number, OR loss_r_in_week: number`
- After each Daily Card save, check if rules are met
- If yes: show modal/banner: "Your self-defined stop-loss has triggered. Take a break."

**UI**:
- Visible alert banner at top of Daily Card if triggered
- Cannot be dismissed without acknowledgment
- "Reset" only available after rest period

**Why it matters**: This is the system **protecting the trader from themselves**. Tendler's tilt-prevention research in mechanical form.

## Implementation priority

When building, implement bridges in this order:

1. **Bridge 1 (Daily→Daily)** — simplest, highest daily value
2. **Bridge 3 (Daily→Weekly auto-aggregation)** — saves 30min per week
3. **Bridge 2 (Weekly→Daily)** — the crucial system loop
4. **Bridge 4 (Weekly→Weekly)** — calibration enabler
5. **Bridge 5 (Weekly→Monthly)** — saves more time
6. **Bridge 9 (Calibration tracking)** — long-term meta value
7. **Bridge 6 (Monthly→Daily error elimination)** — once monthly exists
8. **Bridge 10 (Stop-loss alert)** — safety mechanism
9. **Bridge 7, 8** — quarterly/yearly polish

Don't try to build all at once. Bridge 1+2+3 deliver 80% of the value. Build daily card with these three, fill it for 2 weeks, then build the rest.
