# Trading Pod — Web Application

A trader development system: 5 reflection layers from daily to yearly. Originally built as PDF templates, now being ported to a web application.

## Project context

This is a personal development system for a trader aspiring to become world-class. It is grounded in:

- **Atomic Habits** (James Clear) — identity-based habits, implementation intentions
- **Trading in the Zone** (Mark Douglas) — process vs outcome separation
- **The Mental Game of Trading** (Jared Tendler) — mental capital, tilt thresholds
- **Positive Trading Psychology** (Lazonby) — emotions as data, signature strengths
- **Brett Steenbarger's research** — deliberate practice in trading
- **The Power of Full Engagement** (Schwartz/Loehr) — energy management
- **Superforecasting** (Tetlock) — calibration training
- **Anders Ericsson** — deliberate practice mechanisms

The system is **not a journal**. A journal documents. This system **transforms**.

## The 5-layer architecture

| Layer | Frequency | Time to fill | Purpose |
|---|---|---|---|
| 1. Daily Card | every trading day | 15min pre + 30-45min post | execution + emotions + daily identity |
| 2. Weekly Review | end of week (Fri eve / Sun morning) | 45-60min | aggregation + tier sizing + edge degradation |
| 3. Monthly Review | end of month | 60-90min | trends + error elimination plan + system upgrade |
| 4. Quarterly Review | end of quarter | 90-120min | identity audit + direction + vision check |
| 5. Yearly Review | end of year | 2-3h | balance + strategic decisions + time capsule |

Each layer feeds the next. Daily generates data, Weekly aggregates, Monthly identifies patterns, Quarterly audits identity, Yearly evaluates direction.

## Critical design principles

### 1. Bridges between layers

The system has explicit bridges:

- **Daily → Daily**: each Daily shows yesterday's lesson at the top
- **Weekly → Daily**: each Daily also shows last week's lesson (from Weekly Review section 13)
- **Weekly section 13 ("Bridge to Daily")**: 1 strategic topic + 3 concrete pre-mortem items that the trader physically copies into next week's Daily Cards
- **Monthly → Weekly**: error elimination plan from Monthly drives Weekly focus
- **Quarterly → Monthly**: identity audit drives monthly system upgrades
- **Yearly → all**: identity statement and direction set context for entire year

Without these bridges, layers become isolated rituals. With them, the system **learns about itself**.

### 2. Process vs outcome separation

Every layer separates:
- **Process score** (1-10): quality of decisions, regardless of result
- **P&L**: result, regardless of decisions
- **Overall score**: gold circles to fill in

This is the core of Mark Douglas's framework. The trader learns to evaluate themselves on quality, not luck.

### 3. Identity-based design

Each layer asks identity questions, scaling with timeframe:
- **Daily**: "What did I do today the trader I want to be would be PROUD of? ASHAMED of?"
- **Weekly**: "Where was I that trader, where was I not? What does the gap tell me?"
- **Monthly**: "Identity evolution — concrete behavioral changes vs 30 days ago"
- **Quarterly**: "Identity audit — 3 behaviors I have adopted, 3 I have let go"
- **Yearly**: "Who I was 12 months ago vs who I am now"

This is **identity-based habits** from Atomic Habits, scaled across timeframes.

### 4. Tier sizing as edge tracker

Across all layers, trades are classified A/B/C:
- **A-setup**: 100% position size — highest conviction
- **B-setup**: 50% position size — solid
- **C-setup**: 25% position size — speculative

Weekly Review aggregates per tier. Monthly Review checks if Weekly's "increase/decrease share" decisions were implemented. This creates **brutal edge feedback** — after a few weeks, the trader sees objectively which setup tier actually makes money.

### 5. Mental capital as separate currency

P&L is one currency. Mental capital is another. The system tracks both:
- **Daily**: state after session (1-5) + what shaped it
- **Weekly**: state day-by-day + what renewed / what drained
- **Monthly**: best/worst week + why
- **Quarterly + Yearly**: implicit through identity questions

A profit with mental depletion is not a win. The system sees this.

### 6. Calibration training (Tetlock)

Every layer has the same calibration loop:
- **At end of period**: write what you expected
- **At end of next period**: compare expectation to reality
- **Goals**: assign probability % that you'll achieve them ("ile prawdopodobieństwa daję sobie?")

Over time, this builds **calibrated intuition** — the rare professional trait that separates pros from amateurs.

## Web migration goals

The PDFs are ready as reference artifacts. The web version should:

1. **Preserve all semantic content** — every section, label, question must transfer faithfully
2. **Maintain the design system** — colors, typography, paddings translate directly to CSS variables (provided in `design-system/`)
3. **Add the value web has that PDF doesn't**:
   - Auto-aggregation: Weekly pulls data from 5 Daily Cards automatically
   - Trend visualization: 4-week edge degradation, quarterly trends, etc.
   - Bridge automation: Weekly's "carry to next week" items appear in Monday's Daily Card pre-mortem
   - Identity tracking over time: "you've answered this identity question 47 times — here's the pattern"
   - Calibration tracking: "your goal calibration accuracy: 73% over last 6 months"
4. **Stay disciplined**: don't add features the PDF doesn't have without thinking why. Every addition should have psychological/behavioral justification.

## What's in this repo

- `README.md` — this file
- `docs/` — deep specifications and rationale
  - `philosophy.md` — why each design decision was made
  - `data-schema.md` — how layers connect, schema for database
  - `bridges.md` — explicit bridging mechanisms between layers
  - `merit-analysis.md` — known gaps and future enhancements
- `design-system/` — visual design tokens
  - `tokens.css` — CSS variables (colors, typography, spacing)
  - `components.md` — reusable UI patterns (section header, dot row, table, etc.)
- `specs/` — JSON specifications for each layer
  - `01-daily-card.json` — full Daily Card spec
  - `02-weekly-review.json` — full Weekly Review spec
  - `03-monthly-review.json` — full Monthly Review spec
  - `04-quarterly-review.json` — full Quarterly Review spec
  - `05-yearly-review.json` — full Yearly Review spec
- `reference-pdfs/` — original PDFs for visual reference
  - `01_daily_card_pl.pdf`
  - `02_weekly_review_pl.pdf`
  - `03_monthly_review_pl.pdf`
  - `04_quarterly_review_pl.pdf`
  - `05_yearly_review_pl.pdf`

## Suggested approach for Claude Code

1. **Start by reading** in order: `README.md` → `docs/philosophy.md` → `docs/data-schema.md` → `specs/01-daily-card.json`
2. **Look at the PDFs** to understand visual intent before writing code
3. **Pick a stack** that fits the project:
   - Recommended: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Prisma + SQLite (single-user app), shadcn/ui
   - Alternative: SvelteKit, or pure React + Vite
   - Database: SQLite locally, but design schema for Postgres-portability
4. **Build in order matching the layers** — Daily Card first, then Weekly. Don't build all 5 layers up front. Get one working end-to-end, fill it for a week as a test, then build next.
5. **Bridges are MVP, not nice-to-have** — without bridges, the web app is just a worse PDF. Bridges are the value.

## Languages

- Polish version is the source of truth (PL)
- English version exists for reference but is paused
- Build with i18n in mind (e.g., `next-intl`) so EN can be added later

## Non-goals

- This is **not** a multi-user SaaS. Single user, runs locally or on personal server.
- This is **not** a trading journal in the classic sense. Trade entries are inputs, but the output is **transformation of the trader**.
- This is **not** a brokerage integration. No live data feeds. The trader manually fills inputs.
- This is **not** social. No sharing, no leaderboards. This is intimate work.

## License & ownership

Personal project. The trader filling these forms owns all data. The web app should run locally or on a server controlled by the trader. Never send data to third parties.

---

Read `docs/philosophy.md` next for deeper context on each design decision.
