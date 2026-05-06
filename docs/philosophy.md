# Philosophy of the Trading Pod system

This document explains **why** each design decision was made. Without understanding the why, the web port will look like the PDFs but lose what makes them work.

## Why 5 layers and not 1 mega-form

A single mega-form would compress everything to nothing. Daily reflection happens in a different mental state than yearly reflection:

- **Daily**: tactical, post-session, 30-45min, fresh adrenaline
- **Weekly**: pattern-spotting, weekend, 45-60min, with distance
- **Monthly**: strategic, meta-pattern, 60-90min
- **Quarterly**: identity, who-am-I-becoming, 90-120min
- **Yearly**: existential, where-am-I-going, 2-3h

Different time horizons require different brain modes. Forcing yearly questions on a daily card produces shallow yearly answers and shallow daily answers.

## Why max 2 pages A4 per layer

Constraint forces priority. If you have unlimited space, every section grows to fill it, and the trader writes more about less important things. 2 pages forces every question to earn its place.

In web port: each layer should still feel **bounded**. Don't make Daily Card a 50-section monster just because you can. Keep the discipline.

## Why each section has a specific number of write lines

The number of lines is a **prompt for depth**. 1 line = single sentence. 5 lines = paragraph. 10 lines = essay.

For the trader filling the form, the line count tells them how deep the section expects to go. Don't randomize this in the web port. Each section's line count is intentional.

## Why dot rows (1-5 scale) instead of sliders or stars

- **Discrete** values force a decision (3 or 4, not 3.7)
- **5 options** is the cognitive sweet spot — 7 is too many, 3 is too coarse
- **Numbered** so the trader sees what they're picking
- **Hand-fillable** in PDF, easy to digitize in web

In web: render as 5 radio buttons styled as circles. Same visual model. Don't replace with a slider.

## Why scale anchors are mandatory in section 4 of Daily

The skala "1 = naruszenie zasad, 3 = poprawnie ale automatycznie, 5 = świadomie i zgodnie z planem" is **calibration glue**. Without it, every trader (and every day) interprets "3" differently. With it, "3 in execution" means the same thing today as 6 months from now.

In web: anchor descriptions visible at all times near the rating, not in a tooltip the trader has to hover.

## Why "yesterday's lesson" appears at the top of Daily

Atomic Habits: identity-based habits require **daily contact** with the lesson. If yesterday's lesson is at the bottom (or worse, on a separate document), the trader doesn't see it again until they're already done.

By placing it at the top of the next day's Daily Card, the trader physically encounters their last reflection before doing anything else. The lesson **integrates**.

In web: this is auto-pulled from yesterday's "Tomorrow remember" field. Not a manual copy.

## Why "last week's lesson" also appears in Daily title bar

Weekly review writes a strategic focus. Without anchoring it daily, the trader forgets it by Tuesday. By showing it across all 5 daily cards of the week, the focus stays alive.

In web: pulled from latest Weekly Review's section 13 ("Bridge to Daily — strategic focus topic"). Auto-displayed in Daily Card header for the entire week.

## Why "what ifs" instead of "assumptions" in Daily plan

"Assumptions" leads to confirmation bias. "What ifs" forces scenario planning — including downside scenarios. The phrasing is a **cognitive lever**.

Don't translate "what ifs" to "assumptions" in any UI text. The phrasing matters.

## Why Tier sizing A/B/C in Daily plan

Most retail traders have one position size. Best traders have a **graduated commitment** matching their conviction:
- A-setup: highest conviction → 100% size
- B-setup: solid setup → 50% size
- C-setup: speculative → 25% size

This creates an asymmetric edge: when you're right, you're right big; when you're uncertain, you're small. The tier classification is the trader's daily contract with themselves.

Weekly aggregates by tier. After 4-8 weeks, the trader sees objectively if their A-setups make money, B-setups break even, C-setups bleed. They then adjust.

This is **edge tracking via classification**.

## Why pre-mortem instead of just risk planning

Risk planning answers "what if the market does X?". Pre-mortem answers "what mistakes am **I** likely to make today?".

The trader is more dangerous to themselves than the market. Pre-mortem keeps that visible.

## Why R-multiple expected vs actual in trade log

Tracking "R expected" before the trade and "R actual" after gives the trader **slippage data on themselves**:
- Slippage from market: spread, late fills
- Slippage from self: closing too early, moving stops
- Slippage from setup: setup didn't behave as predicted

Over 100 trades, this becomes a **diagnostic of edge integrity**. Without it, the trader can't tell why their edge is degrading.

## Why "emotions as data" not "emotions are bad"

Most retail trader literature says "remove emotions". This is impossible and harmful. Emotions are **data signals**.

The Daily Card section 5 has 4 columns:
1. Time
2. Emotion (name it)
3. Trigger / context (what caused it)
4. Meaning (signal)
5. Reaction / what I did

This is straight from Lazonby's *Positive Trading Psychology*. The trader learns to read emotions as **information**, not as enemies.

In web: don't replace this with a sentiment slider. The 5-column structure is the value.

## Why two identity questions (proud + ashamed) instead of one

Atomic Habits + Internal Family Systems: identity is **a tension between ideal and current**. Both poles must be visible daily.

- Single question (only "what would the trader I want to be be proud of?") → confirmation bias, trader writes inflated stories
- Two questions (proud + ashamed) → forces honesty, gap is visible

The shame question is **harder** but more diagnostic. Don't soften it in the web port.

## Why "implementation intention" formatting in Daily section 7

"When ___, then ___" is a specific cognitive structure researched by Peter Gollwitzer. It's far more behaviorally effective than "I'll try to do X".

Don't replace with a single text field. The two-field "When / then" structure prompts the right type of thinking.

## Why mental capital is a separate metric

Schwartz & Loehr (*The Power of Full Engagement*): humans operate on **four energy reserves** — physical, emotional, mental, spiritual. Trading depletes all four.

A trader who finishes the day with +3% P&L and -4 mental capital has not won. They've borrowed against tomorrow.

By tracking mental capital separately:
- Daily: post-session state 1-5 + what shaped it
- Weekly: 5-day pattern + what renewed / drained
- Monthly: best/worst week + why

The trader builds awareness of their own depletion patterns. Then defines **rituals of renewal** in the renewal column. This is energy management as a trader skill.

## Why "deliberate practice" is its own section

Anders Ericsson: world-class performance requires deliberate practice — focused work outside of live performance. For a trader:
- Backtest specific setup on 100 historical situations
- Replay key moments from past sessions
- Read targeted material on a specific weakness
- Drill specific recognition patterns

By giving this its own section in Daily ("What did I do today for my edge **outside of trading**?"), the system signals: live trading alone won't make you world-class. You need the off-session work.

In Weekly, this becomes a **3-task plan with priority** (1 MUST, 2 SHOULD). In Monthly, the trader picks **one error to eliminate** with a 4-week plan.

## Why calibration questions

Tetlock: professional forecasters have **calibrated intuition**. They're not always right, but their stated probabilities match outcomes over time.

Each goal in the system asks: "Probability you'll achieve this: __%". After the period, the trader compares: did I hit it? At what stated probability?

After 50 goals across timeframes, the trader has data on their own calibration. Are they overconfident? Pessimistic? Random? This is **meta-skill development**.

In web: track all calibrations over time. Show calibration accuracy curve. This is huge value the PDF can't deliver.

## Why "letter to self" appears in Monthly + Quarterly + Yearly

Atomic Habits: identity reinforcement requires **time-distance**. Writing to your future self forces:
1. Specificity (vague messages aren't worth writing)
2. Compassion (you treat your future self with care)
3. Accountability (you'll read it back)

The progressive depth: 30 days, 90 days, 12 months. Each adds existential weight.

In web: store these letters. Show them on the right date — Monthly review #2 should display the letter from Monthly review #1. This is the **time capsule mechanic**.

## Why stop-loss for self in Weekly

Tendler: professional traders define **tilt thresholds before they get there**. Once tilted, judgment is impaired — too late to define limits.

Weekly section 15 asks: "My automatic stop threshold (mental state X for Y days / loss of Z R in a week)". This is a pre-commitment.

In web: when daily mental state ≤ threshold for N days, app should **alert** the trader. This is the system protecting them from themselves.

## Why gratitude in Weekly section 8

Steenbarger, Tendler, Lazonby — all three independently emphasize: a trader without **regular positive anchoring** burns out in 3-6 months.

This isn't soft. It's **nervous system regulation**. The trader operates in a high-stress state for hours daily. Without explicit positive practice, the system hardens.

The question is "What am I grateful for this week — personal, not necessarily trading". The personal angle prevents this from becoming another performance metric.

## Why "vision check" in Quarterly

Quarterly review asks: "What I wanted 90 days ago, what I want now. Evolution or surrender?"

People change. Goals that fit 90 days ago may not fit today. Without explicit vision check, traders pursue stale goals out of inertia. The question forces choice: am I still pursuing this, or am I drifting?

## Why "time capsule" framing in Yearly section 12

The yearly letter is framed: "The trader who starts this year writes to the trader who finishes it." This is a **ritualistic frame** that elevates the act from "task" to "tradition".

Don't dilute this in UI. The framing is part of the medicine.

## Why no ads, no social, no SaaS

This is **intimate work**. The trader is being honest with themselves about their failures, fears, identity gaps. Any third party in this loop kills the honesty.

Run locally. Run on personal server. Never send to third parties. Never monetize this directly.

If web app needs to be hosted, the trader should host their own instance.

---

Read `docs/data-schema.md` next for the technical schema.
