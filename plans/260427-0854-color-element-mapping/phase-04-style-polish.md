---
title: "Phase 04 — Toggle, panel transitions, chip styling, legend, responsive"
status: pending
priority: P2
effort: 35m
---

## Context Links

- Plan overview: [plan.md](plan.md)
- Phase 02 (toggle / panel structure dependency): [phase-02-dual-mode-shell.md](phase-02-dual-mode-shell.md)
- Phase 03 (chip markup dependency): [phase-03-render-modern-grid.md](phase-03-render-modern-grid.md)
- Existing file: `style.css` (current `.card`, `.grid`, color vars)

## Overview

- **Priority:** P2
- **Status:** pending
- **Description:** Append CSS for the new dual-mode UI: segmented toggle (`.mode-toggle`, tabs, focus ring), panel `[hidden]` + opacity transition, plus the chip / count / legend / error / responsive rules originally planned. Keep all existing rules.

## Key Insights

- Two distinct concerns in this phase: **(A)** the toggle + panel transition (new in this revision), **(B)** chip / legend / responsive (carried over from the original Phase 03 plan). Bundled because they live in the same `style.css` file and share design tokens — splitting would create two trivial phases.
- The existing grid uses `auto-fit, minmax(160px, 1fr)`. With long chip lists in Modern, cards become tall — fine, but on mobile (single column) we want them readable, not a wall of text.
- Existing CSS vars (`--kim`, `--thuy`, etc.) remain the right element accents. Chips use the language hex; card border-top stays element-coloured.
- Both panels coexist in DOM; toggling `[hidden]` is the canonical hide. CSS reinforces with `[hidden] { display: none; }` (browsers honor this, but explicitness helps when overriding for transitions).
- Opacity fade on switch: simple — apply `transition: opacity 150ms ease` to the panel, set `opacity: 0` while hidden via attribute, but `[hidden]` already removes from layout. KISS: skip cross-fade choreography. Just fade-in the becoming-visible panel via animation. Implementation: keep `[hidden] { display:none }`; when newly shown, the panel naturally appears. Add `@keyframes fadeIn` and apply to non-hidden panels. Cheap, no JS coordination.
- KISS: no animation beyond the existing `:hover translateY` and the new fade-in. No dark mode. No hover tooltips beyond browser-native `title`.

## Requirements

### Functional

#### A. Toggle + panel transitions
- `.mode-toggle` is a centered horizontal flex container; small gap; max-width matches the page content.
- Each `[role="tab"]` button: pill-shaped, neutral background when inactive (`var(--card-bg)` or transparent), accent background when `aria-selected="true"` (`var(--accent)` background, white text). Border, rounded corners, padding.
- Focus ring: visible 2px outline (`outline: 2px solid var(--gold); outline-offset: 2px`) on `:focus-visible` only.
- `[role="tabpanel"][hidden]` → `display: none` (default browser behavior; reinforced explicitly).
- `[role="tabpanel"]:not([hidden])` → fade in via `@keyframes fadeIn` (opacity 0 → 1 over 150ms). No layout shift.
- `.mode-tag` (the `<small>` inside h2): muted, italic, `0.85rem`.

#### B. Chip / legend / responsive (originally planned)
- `.chips` is a flex container that wraps.
- `.chip` is a small inline-block with rounded corners, padded, font-size ~0.78rem. No `text-shadow` (we already pick contrast color).
- `.card-count` is a muted small label under `<h3>`.
- `.legend` is centered, italic, `var(--muted)`, `0.85rem`.
- `.render-error` is centered, `var(--accent)` color, padded, dashed border.
- `.original-image` (the `<details>` block in Modern panel): inherit existing figure styles; `<summary>` should be readable (cursor pointer, muted color).
- Mobile (≤500px): chips slightly smaller; grid collapses to single column; toggle buttons shrink padding/font-size to stay on one row.

### Non-functional
- No new CSS file. Append to existing `style.css`. Total file should remain ≤ 280 lines (currently 175).
- No CSS frameworks, no preprocessors.
- Chips must remain readable on extreme colors (e.g. `#000000` Linguist entries). The `pickTextColor` from Phase 03 already handles this; CSS does not need to override.
- Animation respects `prefers-reduced-motion`: wrap `@keyframes fadeIn` usage in `@media (prefers-reduced-motion: no-preference)`.

## Architecture

No structural change. Just additive selectors.

### Selectors to add

```css
/* A. Toggle + panels */
.mode-toggle              /* flex tablist wrapper */
.mode-toggle [role="tab"] /* tab button base */
.mode-toggle [role="tab"][aria-selected="true"]  /* active tab */
.mode-toggle [role="tab"]:focus-visible          /* focus ring */
[role="tabpanel"][hidden] /* explicit display:none */
.mode-tag                 /* "(theo bài gốc, 2018)" small tag in h2 */
.original-image           /* <details> wrapping the duplicate image in Modern */
.original-image summary   /* clickable summary styling */
@keyframes fadeIn         /* opacity 0 → 1 */

/* B. Grid contents */
.chips        /* flex wrap container inside .card */
.chip         /* individual language pill */
.card-count   /* small count under <h3> */
.legend       /* one-line rule explanation */
.render-error /* fetch failure inline message */

/* Responsive */
@media (max-width: 500px) { ... }
@media (prefers-reduced-motion: no-preference) { /* fade-in */ }
```

### Visual hierarchy (modern panel)

```
.card
 ├── h3 (existing element-color title)
 ├── .card-count    ← small muted "{n} ngôn ngữ"
 └── .chips         ← flex wrap
      └── .chip ×N  ← background = language hex, color = computed contrast
```

## Related Code Files

### Create
- None.

### Modify
- `style.css` — append new selectors at the end.

### Delete
- None.

## Implementation Steps

1. Open `style.css`, append a "Dual-mode toggle + panels" block after the existing `.card.tho h3 { ... }` rules (around line 133):

```css
/* ===== Dual-mode toggle + panels ===== */
.mode-toggle {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin: 1rem 0 1.5rem;
}
.mode-toggle [role="tab"] {
  font: inherit;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  border: 1px solid var(--muted);
  background: var(--card-bg);
  color: var(--fg);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.mode-toggle [role="tab"][aria-selected="true"] {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.mode-toggle [role="tab"]:hover {
  border-color: var(--accent);
}
.mode-toggle [role="tab"]:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}
[role="tabpanel"][hidden] { display: none; }
.mode-tag {
  font-size: 0.85rem;
  font-style: italic;
  color: var(--muted);
  font-weight: normal;
  margin-left: 0.4rem;
}
.original-image {
  margin: 2rem 0 0;
  background: var(--card-bg);
  padding: 0.75rem 1rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
}
.original-image summary {
  cursor: pointer;
  color: var(--muted);
  font-style: italic;
}
.original-image figure { margin: 0.75rem 0 0; }
.original-image img { display: block; max-width: 100%; height: auto; border-radius: 8px; }
.original-image figcaption {
  text-align: center;
  margin-top: 0.5rem;
  color: var(--muted);
  font-size: 0.9rem;
}
@media (prefers-reduced-motion: no-preference) {
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  [role="tabpanel"]:not([hidden]) { animation: fadeIn 150ms ease; }
}
```

2. Append the chip / legend / error block:

```css
/* ===== Chip grid (modern panel) ===== */
.card-count {
  display: block;
  margin: 0 0 0.6rem;
  color: var(--muted);
  font-size: 0.8rem;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.chip {
  display: inline-block;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  font-size: 0.78rem;
  line-height: 1.4;
  border: 1px solid rgba(0, 0, 0, 0.08);
  white-space: nowrap;
}
.legend {
  text-align: center;
  font-style: italic;
  color: var(--muted);
  font-size: 0.85rem;
  margin: 1rem 0 0;
}
.render-error {
  text-align: center;
  color: var(--accent);
  padding: 1rem;
  border: 1px dashed var(--accent);
  border-radius: 8px;
}
@media (max-width: 500px) {
  .chip { font-size: 0.72rem; padding: 0.15rem 0.45rem; }
  .grid { grid-template-columns: 1fr; }
  .mode-toggle [role="tab"] { padding: 0.35rem 0.75rem; font-size: 0.9rem; }
}
```

3. Reload `http://localhost:8080`. Verify:
   - Toggle: two pill buttons centered above the panels; active tab is accent-coloured.
   - Tab focus ring: gold outline appears when tabbing in via keyboard.
   - Switching tabs: the becoming-visible panel fades in (≤150ms).
   - Modern panel: chips wrap nicely inside cards; yellow JavaScript chip has black text; dark blue Python chip has white text.
   - Mobile (Chrome devtools, 375px width): one card per row; tabs still on one line; chips readable.
   - Classic panel: image + 5 cards visually unchanged from pre-Phase-04.
   - `<details>Ảnh gốc</details>` (in Modern): summary line muted/italic; expanding shows the image card-styled.

## Todo List

- [ ] Append `.mode-toggle` flex container + button base + active + hover + focus-visible rules
- [ ] Append `[role="tabpanel"][hidden] { display:none }` reinforcement
- [ ] Append `.mode-tag` muted-italic style
- [ ] Append `.original-image` + `summary` + nested `figure/img/figcaption` styles
- [ ] Append `@keyframes fadeIn` inside `prefers-reduced-motion: no-preference` guard
- [ ] Append `.card-count` rule
- [ ] Append `.chips` flex wrap container rule
- [ ] Append `.chip` pill rule (no color/background — set inline in JS)
- [ ] Append `.legend` and `.render-error` rules
- [ ] Append `@media (max-width: 500px)` block (chip + grid + toggle adjustments)
- [ ] Visual smoke test desktop + 375px mobile, both modes, with reduced-motion on/off

## Success Criteria

- Toggle visually reads as a segmented control; active tab is unambiguous.
- Keyboard focus ring visible on tab focus (Tab key navigation).
- Panel switch produces a soft fade-in (no layout flash) with reduced-motion respected.
- Chips are rounded pills; do not overlap; wrap to next line when card width exhausted.
- Card with 100+ chips remains within page width (no horizontal scroll on a 320px viewport).
- Legend renders centered, italic, muted under the grid.
- Classic panel layout/colors visually identical to before this phase.
- `style.css` total length ≤ 280 lines.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Long card heights in Modern cause uneven grid rows | High | Low | Acceptable; grid auto-fit handles it. Don't force equal heights. |
| Chip with `#000` looks like a hole | Med | Low | Border on chip provides outline (rule already includes 1px border) |
| Mobile toggle wraps to two lines on very narrow screens | Med | Low | `@media` block reduces button padding. If still wraps at <320px, acceptable. |
| Fade-in animation runs on the *initial* visible panel on page load (Classic) | Med | Low | Acceptable; users see Classic fade in once, looks intentional. If undesired, gate with `:not([data-initial])` flag set by `mode-toggle.js`. |
| `prefers-reduced-motion` users still see fade due to a missed media query | Low | Low | Wrapping the keyframes definition + usage inside `@media (prefers-reduced-motion: no-preference)` ensures reduced-motion users get instant switches. |
| Active-tab contrast (white on `--accent`) fails AA on bright accents | Low | Med | Current `--accent` is `#b8312f` (dark red); white text passes AA. If accent changes, re-check. |

## Security Considerations

- Pure CSS, no security implications. No `url(...)`, no `@import` from external.

## Next Steps

- Phase 05 (optional) adds a debug panel inside `#panel-modern` — its `.render-error` style is already provided here; debug panel reuses standard `<details>` plus existing `.chip` styling.
