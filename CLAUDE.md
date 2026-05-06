# Instructions for Claude Code

This is a personal project porting a 5-layer trader development system from PDF to web. Read this file first, then follow the suggested order below.

## Read in this order

1. **`README.md`** — project overview, the 5 layers, design principles
2. **`docs/philosophy.md`** — WHY each design decision was made (read carefully — without this, you'll port the form but lose what makes it work)
3. **`docs/data-schema.md`** — entity structure, how layers connect
4. **`docs/bridges.md`** — THE MOST IMPORTANT TECHNICAL DOC. Without proper bridges, the web app is just a worse PDF.
5. **`docs/merit-analysis.md`** — what's deliberately deferred, what NOT to add
6. **`design-system/tokens.css`** — exact color/typography values
7. **`design-system/components.md`** — UI component patterns
8. **`specs/01-daily-card.json`** — full Daily Card spec
9. **`specs/02-weekly-review.json`** — full Weekly Review spec
10. **`specs/03-monthly-review.json`** — Monthly spec
11. **`specs/04-quarterly-review.json`** — Quarterly spec
12. **`specs/05-yearly-review.json`** — Yearly spec
13. **`reference-pdfs/`** — open the PDFs to see visual intent

## Key decisions already made

- **Language**: TypeScript (everywhere)
- **Source of truth**: Polish (PL). English is paused — design with i18n (`next-intl` recommended) so EN can be added later.
- **Data**: Single user, runs locally. Database: SQLite via Prisma (portable to Postgres for self-hosted server).
- **Form approach**: Long-form, single column, focused. NOT mobile-first quick-fill.
- **No third parties**: Never send data anywhere. Trader owns everything.

## Decisions YOU should make

- **Stack**: Next.js 14+ with App Router is recommended for full-stack simplicity. Alternatives: SvelteKit, or Vite + React + a small backend. Discuss with the user before choosing.
- **UI library**: shadcn/ui pairs well with the design system. Or roll custom — the components are simple.
- **Auth**: For a single-user local app, can skip auth entirely or use a simple session. For self-hosted server, basic auth is fine.
- **Hosting**: User runs locally on their machine, OR self-hosts on personal VPS. Don't suggest Vercel-managed solutions that send data through third parties.

## Build order

**Don't build everything at once. Stage it.**

### Phase 1 — MVP (Daily + Weekly with bridges)
1. Set up project, design system tokens
2. Build core components: SectionHeader, DotRow, TextInput, TextArea, GoldCircles, TableInput
3. Build Daily Card (layer 1) end-to-end with persistence
4. Build Bridge 1 (yesterday's lesson auto-populates) — verify it works
5. Build Weekly Review (layer 2)
6. Build Bridge 3 (Daily→Weekly auto-aggregation) — biggest UX win
7. Build Bridge 2 (Weekly→Daily strategic topic + pre-mortem items)
8. **STOP HERE**. Tell the user to fill it for 2 weeks. Real usage will reveal more than additional features.

### Phase 2 — after real usage feedback
9. Add Monthly Review based on what trader noticed in 2-week test
10. Add Bridges 4, 5
11. Add Quarterly + Yearly
12. Add Bridges 6-10

### Phase 3 — analytics
13. Calibration tracking dashboard
14. Stop-loss alert system
15. Identity pattern detection

## Critical principles

### Don't lose the philosophy

The forms look simple. They are not. Every label, every line count, every two-column split is **intentional and grounded in research**. Before changing any wording, structure, or count, read `docs/philosophy.md`.

If you find yourself thinking "I'll just simplify this part" — STOP and ask the user. Likely you're about to remove the load-bearing element.

### Bridges are MVP, not nice-to-have

A web app without bridges is worse than the PDF (manual data entry, no automation). With bridges, it's transformative. **Phase 1 is incomplete without Bridges 1, 2, 3.**

### Resist feature creep

`docs/merit-analysis.md` lists known gaps. Many are deliberately deferred. Don't add:
- Streaks / gamification
- Social features
- AI-generated content
- Notifications (except stop-loss alerts)
- Mobile-first quick fill

The user wants a **serious tool**, not a productivity app.

### Single column, even on desktop

Long-form reflection works in one column. Don't get clever with multi-column layouts on desktop. Max width ~700px for content.

### One language at a time

Polish only for now. Use proper i18n setup so adding English later is straightforward, but don't build EN UI now — it's distraction.

## Visual fidelity goals

The web should **feel like the PDF, but better**:
- Same colors (use tokens.css)
- Same typography hierarchy
- Same section header style (dark navy + gold accent stripe)
- Same calmness — no animation overload, no decorative elements
- Same density — not too sparse, not too cramped

But improve where digital allows:
- Auto-aggregation eliminates manual data entry
- Bridges make the system learn about itself
- Calibration tracking creates a meta-skill loop
- Pattern detection over time
- Stop-loss alerts protect the trader

## When in doubt

When you're unsure about a design decision, the answer is in `docs/philosophy.md`. If it's not there, **ask the user**. Don't guess. The user has spent significant time iterating on these forms — every detail has reasoning behind it.

## What "done" looks like

Phase 1 is done when:
- [ ] User can fill a Daily Card and save it
- [ ] Next day, Daily Card opens with yesterday's lesson auto-populated
- [ ] After 5 daily cards, Weekly Review opens with stats auto-calculated
- [ ] User fills Weekly Review's "Bridge to Daily" section
- [ ] Next Monday, Daily Card shows weekly's strategic topic in title bar
- [ ] All works locally, no third-party data leakage
- [ ] Print stylesheet works (user can print to PDF if they want)

## Working with the user

The user is a trader, not necessarily a developer. They:
- Care deeply about the philosophy (read those docs!)
- Will recognize visual mismatches with PDF immediately
- Will spot if you cut a "small detail" that was actually load-bearing
- Want to test the system in their real practice as soon as possible

Communicate decisions clearly. Show progress visually (screenshots). Don't go silent for hours.

Good luck. This is meaningful work.
