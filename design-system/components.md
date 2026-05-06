# UI Components — patterns from the PDF, ported to web

This document maps each visual element from the PDF to its web equivalent. Use these as building blocks. They should be **reusable React/Vue/Svelte components**, not one-offs.

## 1. SectionHeader

**PDF**: dark navy bar with gold left accent stripe, white bold text "1. KONTEKST OSOBISTY (RANO)"

**Web component**:
```tsx
<SectionHeader
  number="1"
  title="Kontekst osobisty (rano)"
/>
```

**Renders**:
```html
<div class="section-header">
  <div class="section-header__accent"></div>
  <h2 class="section-header__title">1. KONTEKST OSOBISTY (RANO)</h2>
</div>
```

**CSS**:
```css
.section-header {
  background: var(--color-mid);
  border-radius: var(--radius-section-header);
  padding: 6px 12px 6px 16px;
  position: relative;
  display: flex;
  align-items: center;
  height: var(--section-header-height);
}

.section-header__accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--section-accent-stripe);
  background: var(--color-gold);
}

.section-header__title {
  color: var(--color-white);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-header);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin: 0;
}
```

## 2. FieldLabel + WriteLine (single-line text input)

**PDF**: muted gray label, then a horizontal underline that the user writes on.

**Web component**:
```tsx
<TextInput
  label="Trend / bias:"
  value={value}
  onChange={setValue}
/>
```

**Renders**:
```html
<label class="field">
  <span class="field__label">Trend / bias:</span>
  <input class="field__input" type="text" />
</label>
```

**CSS**:
```css
.field {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 0;
}

.field__label {
  color: var(--color-muted);
  font-size: var(--font-size-label);
  white-space: nowrap;
}

.field__input {
  flex: 1;
  border: none;
  border-bottom: 0.5px solid var(--color-border);
  background: transparent;
  padding: 2px 4px;
  font-family: var(--font-family);
  font-size: var(--font-size-label);
  color: var(--color-text);
}

.field__input:focus {
  outline: none;
  border-bottom-color: var(--color-accent);
  border-bottom-width: 1.5px;
}
```

## 3. WriteArea (multi-line)

**PDF**: muted label above, then several horizontal lines.

**Web component**: textarea with line-styled background, OR multiple individual inputs.

```tsx
<TextArea
  label="Mood / notes:"
  rows={5}
  value={value}
  onChange={setValue}
/>
```

```css
.textarea-with-lines {
  background-image: linear-gradient(to bottom, transparent 19px, var(--color-border) 19px, var(--color-border) 20px, transparent 20px);
  background-size: 100% 20px;
  background-attachment: local;
  line-height: 20px;
  min-height: 100px;
  resize: vertical;
  border: none;
  padding: 0;
  font-family: var(--font-family);
}
```

This recreates the lined-paper aesthetic.

## 4. DotRow (1-5 rating)

**PDF**: label, then 5 numbered circles. User fills one.

**Web component**:
```tsx
<DotRow
  label="Sleep:"
  value={value}
  onChange={setValue}
  options={[1, 2, 3, 4, 5]}
/>
```

**Renders**: 5 radio buttons styled as circles.

```html
<div class="dot-row">
  <span class="dot-row__label">Sleep:</span>
  <div class="dot-row__options" role="radiogroup">
    <label class="dot"><input type="radio" name="sleep" value="1" /><span>1</span></label>
    <label class="dot"><input type="radio" name="sleep" value="2" /><span>2</span></label>
    <!-- ... -->
  </div>
</div>
```

```css
.dot-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot-row__label {
  color: var(--color-muted);
  font-size: var(--font-size-label);
  width: 90px;
}

.dot-row__options {
  display: flex;
  gap: 6px;
}

.dot {
  position: relative;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.dot input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.dot span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border: 0.8px solid var(--color-accent);
  border-radius: 50%;
  background: var(--color-white);
  font-size: 8px;
  color: var(--color-muted);
  transition: var(--transition-fast);
}

.dot input[type="radio"]:checked + span {
  background: var(--color-accent);
  color: var(--color-white);
  font-weight: var(--font-weight-bold);
}

.dot:hover span {
  border-color: var(--color-gold);
}
```

## 5. ScaleRow (1-10 rating, used in Quarterly + Yearly)

Same as DotRow but with 10 options and gold stroke instead of accent.

```tsx
<ScaleRow
  label="Subjektywna ocena postępu (1 = jak 90 dni temu, 10 = jestem nim):"
  value={value}
  onChange={setValue}
  range={10}
  variant="gold"
/>
```

Use `--color-gold` for stroke instead of `--color-accent`.

## 6. GoldCircles (5 gold circles for "Overall score")

**PDF**: 5 large gold-stroked circles in Daily section 11.

```tsx
<GoldCircleScale
  label="Ogólna ocena:"
  value={value}
  onChange={setValue}
/>
```

Larger than DotRow circles. No internal numbers (or optional). Different visual weight to mark this as the "summary score".

## 7. TableInput

**PDF**: table with dark navy column headers, white text, then bordered rows for input.

For trade log (14 rows), emotion log, weekly stats, etc.

```tsx
<TableInput
  columns={[
    { id: 'time', label: 'Czas', width: 0.06 },
    { id: 'trigger', label: 'Trigger', width: 0.13 },
    { id: 'setup', label: 'Setup', width: 0.18 },
    // ...
  ]}
  rows={trades}
  onAddRow={() => ...}
  onUpdateRow={(id, field, value) => ...}
  emptyRowsCount={14}  /* show empty rows for hand-fillable feel */
/>
```

Web should:
- Show empty rows initially (matches PDF)
- Allow "add row" button for unlimited rows
- Allow paste from spreadsheet (huge UX win)
- Fixed column widths matching PDF fractions

## 8. ImplementationIntention

**PDF**: "Kiedy ___, wtedy ___" two-field structure in Daily section 8.

```tsx
<ImplementationIntention
  whenValue={whenVal}
  thenValue={thenVal}
  extraValue={extraVal}
  onChangeWhen={setWhen}
  onChangeThen={setThen}
  onChangeExtra={setExtra}
/>
```

```html
<div class="impl-intention">
  <div class="impl-intention__row">
    <label class="field-inline"><span>Kiedy</span><input value={...} /></label>
    <label class="field-inline"><span>wtedy</span><input value={...} /></label>
  </div>
  <textarea class="impl-intention__extra" rows={4} />
</div>
```

The "When/then" structure is the **cognitive lever** (Gollwitzer's research). Don't replace with single textarea.

## 9. NumberedList

**PDF**: numbered entries with bold accent number + write lines.

Used for: weekly's "3 lessons", quarterly's "3 strengths", yearly's "3 lessons of year".

```tsx
<NumberedList
  count={3}
  linesPerItem={4}
  values={values}
  onChange={setValues}
/>
```

Each item is auto-numbered "1.", "2.", "3." in accent color. Each has N write lines (or expandable textarea).

## 10. CalibrationField

**PDF**: "Probability you'll achieve goal: ___ %" + "What must be true: ___"

```tsx
<CalibrationField
  goalText={goal}
  probability={prob}
  whatMustBeTrue={mustBeTrue}
  onChange={...}
/>
```

Web enhancement: when probability is filled, save it linked to the goal. Show calibration history on a separate `/calibration` page.

## 11. TitleBar

**PDF**: light gray bar with gold accent stripe, page title on left, supplementary fields on right (Date / Market / Session, etc).

```tsx
<TitleBar
  title="TRADING POD · DAILY CARD"
  leftFields={[
    { label: 'Data:', name: 'date', type: 'date' },
    { label: 'Rynek:', name: 'market' },
    { label: 'Sesja:', name: 'session' },
  ]}
  rightFields={[
    { label: 'LEKCJA Z WCZORAJ:', name: 'yesterday_lesson', readOnly: true, value: prefilled },
    { label: 'LEKCJA Z POPRZ. TYGODNIA (Weekly Review):', name: 'last_week_lesson', readOnly: true, value: prefilled },
  ]}
/>
```

The right fields can be read-only when auto-pulled from previous days/weeks (the bridges).

## 12. PageIndicator

**PDF**: "strona 1 / 2" in muted text bottom right.

For web: not needed if everything is on one scroll, BUT useful if you split layers into tabs or steps.

## 13. ScaleAnchorCaption

**PDF**: italic muted small text under area scores table: "1 = naruszenie zasad · 3 = poprawnie ale automatycznie · 5 = świadomie i zgodnie z planem"

```tsx
<ScaleAnchorCaption text="..." />
```

```css
.scale-anchor {
  font-style: italic;
  color: var(--color-muted);
  font-size: var(--font-size-tiny);
  padding: 4px 0;
}
```

This is **calibration glue** — don't hide it in tooltips. Always visible.

## 14. SectionGapDivider

Between sections: small vertical gap (--gap-between-sections).

No visible divider line (sections are visually distinguished by their headers).

## 15. BridgeIndicator (web-only enhancement)

When a field is auto-populated from a bridge, show subtle indicator:

```html
<div class="bridge-indicator">
  <span class="bridge-indicator__icon">↗</span>
  <span class="bridge-indicator__text">From last week's review</span>
</div>
```

This makes the bridges visible to the user, building trust in the system.

## Layout principles

- **Stack sections vertically** with --gap-between-sections
- **Each section** has the same internal structure: SectionHeader → SectionContent
- **SectionContent** is a flex/grid container with proper padding (--pad-section-top, --pad-section-bottom)
- **Don't use cards** for sections. The PDF doesn't, and the design works because of the dark navy header doing the visual work
- **One column on desktop, one column on mobile** — yes, even on desktop. The PDF is one column. Long form reflection works better in single column.
- **Max width**: ~700px for content area. Don't let lines get too long for handwriting-equivalent reading.

## Don't

- Don't add cards/borders around every section. The header bar is enough.
- Don't add fancy animations. This is a serious tool, not a game.
- Don't use emoji icons. PDF doesn't.
- Don't add "share" buttons. This is intimate work.
- Don't add gamification ("you've filled 47 cards in a row!"). Trader doesn't need dopamine, they need honesty.
