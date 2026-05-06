# Merit analysis — known gaps and future enhancements

This is the "what we know is missing" document. The PDF system was iterated through several merit reviews. Some gaps were addressed (8 fixes incorporated into Weekly Review v2). Others were noted but **deliberately deferred** to see how the system performs in practice before adding more.

These are NOT bugs. They are consciously deferred features.

## Deferred from the system, in priority order

### 1. Mid-week check-in (HIGH PRIORITY for v2)

**Gap**: Daily reflection happens after each session. Weekly happens at week's end. There's no Wednesday-evening touch point. By the time the trader notices "this week is going off-track", it's Friday and too late to course-correct.

**Proposed solution**: A small Wednesday-only block at the bottom of Daily Card asking "Are 3 of 5 days already pointing to weekly goal being at risk? What to change for Thu/Fri?"

**Decision**: Deferred. Test the system without it for 4-6 weeks. If pattern of week-late realization shows up, add this.

### 2. Identity question rotation (MEDIUM PRIORITY)

**Gap**: Daily section 12 always asks the same two questions (proud / ashamed). After 90 days, mind learns to answer automatically. Rotation prevents this.

**Proposed solution**: Mon-Thu → standard 2 questions. Fri → deeper third question: "Whom did I want to become 90 days ago — and did I move toward it?"

**Decision**: Deferred. Implement in v2 after observing automatization.

### 3. Tier classification timing (DESIGN QUESTION)

**Gap**: Daily plan (morning) asks trader to plan A/B/C tier setups. But intraday reality often presents setups the trader didn't anticipate. Trader knows A-setup when they see it, not when planning it.

**Alternative design**: Move Tier from "planned" to "observed" — trader marks Tier in trade log AT TIME OF TRADE, not in pre-session plan.

**Trade-off**: Pre-planning forces discipline (won't take random setups). Post-classification matches reality.

**Decision**: Currently designed as PRE-PLANNED. If trader feels it's restrictive, switch to OBSERVED. Both are valid; this is a values choice.

### 4. Body / sleep aggregation (LOW PRIORITY)

**Gap**: Daily has Sleep/Energy/Focus 1-5 ratings. Weekly v2 added "Sleep avg h" column to stats. But:
- No correlation analysis ("on weeks I sleep <6h, my Win rate is X% lower")
- No trend visualization over months

**Proposed solution**: After 8+ weeks of data, show correlation panel. "Your decisions quality drops 23% when sleep ≤ 4."

**Decision**: Web migration is a great moment to add this. Auto-calculation across weeks is trivial in DB.

### 5. Wednesday evening compounding ritual (DEFERRED CONCEPT)

**Gap**: Some traders benefit from a brief Wednesday "compounding" pause — re-reading Monday's Daily Card to see how the week is unfolding.

**Decision**: Deferred. May not be needed if the bridges work as designed.

## Web-specific enhancements not in PDF

These are things web can do that PDF cannot. They're high-value additions for the web port.

### A. Auto-aggregation (CRITICAL — must be in MVP)

PDF requires manual copying of stats from Daily to Weekly. This is 30-60min of pure data entry per week. Web auto-calculates. **This alone justifies the web port.**

### B. Calibration tracking dashboard (HIGH VALUE)

Every goal across layers has `probability_assigned` (Tetlock calibration). PDF cannot track this over time. Web can:
- Show calibration accuracy curve
- Detect bias ("you're consistently 23% overconfident on weekly goals")
- Visualize improvement over months

This is **meta-skill development** — an entire trader-quality dimension only web can provide.

### C. Stop-loss alert system (SAFETY)

Weekly section 16 stores `stop_loss_threshold` (free text). Web can parse this and trigger alerts when crossed:
- Mental state ≤ 2 for 3 days → banner: "STOP-LOSS TRIGGERED. Take a break."
- -5R in week → same

PDF cannot do this. Web is **active protection**.

### D. Identity question pattern detection (MEDIUM VALUE)

Over 90 days of Daily Cards, the trader's "proud of" / "ashamed of" answers form patterns. Web can show:
- Most frequent themes in proud answers
- Most frequent themes in ashamed answers
- The gap = trader's growth edge

This is **identity diagnostics** that no PDF can deliver.

### E. Bridge automation (THE MAIN VALUE)

Already covered in `bridges.md`. Web auto-pulls yesterday's lesson into today's card, weekly's strategic topic into the week's daily cards, monthly's elimination plan into next month's daily pre-mortems. This is **what makes the system learn about itself**.

### F. Time capsule reveal (RITUAL)

Letters to self (Monthly, Quarterly, Yearly) are stored. Web shows them on the right date — when next review opens, the previous letter is displayed at top. PDF requires the trader to physically save letters. Web automates the ritual.

## What NOT to add (anti-features)

These are temptations to resist. The PDF design rejected them deliberately.

- ❌ Streaks / gamification ("47 cards in a row!") — trader doesn't need dopamine, they need honesty
- ❌ Social sharing — this is intimate work, never share
- ❌ AI-generated reflections — defeats the entire purpose
- ❌ Mobile-first / quick fill — these forms require focused 30-60min sessions, not phone-tap interruptions
- ❌ Live broker integration — manual entry forces awareness of each trade
- ❌ "Mood-based UI themes" — distraction
- ❌ Public leaderboards — destroys honesty
- ❌ Notifications — except for stop-loss alerts (those are safety)

## Versioning strategy

- **v1.0 (MVP)**: Daily + Weekly with Bridges 1, 2, 3
- **v1.1**: Add Monthly + Bridges 4, 5
- **v1.2**: Add Quarterly + Bridge 7
- **v1.3**: Add Yearly + Bridge 8
- **v2.0**: Calibration tracking dashboard, stop-loss alerts, identity pattern detection
- **v2.1**: Mid-week check-in, identity question rotation, body/sleep correlation analysis

Don't try to ship 2.0 features in 1.0. Get the foundation right, fill it for 2-3 months yourself, **then** add the analytics.
