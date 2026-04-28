# Phase 01 — Style & markup polish

## Context

Items 5–10 (CSS one-liners), item 13 (chip `role="list"`/`"listitem"`), items 14/15 (decision documentation as code comments). Lowest risk, fastest win. Single pass through `style.css`, `index.html`, `js/render-elements.js`.

## Overview

- **Priority:** P2 (polish) + cleanup of decision docs
- **Status:** pending
- **Effort:** ~30 min hand-edit + 10 min manual verify
- **Risk:** very low — pure cosmetic / declarative

## Files modified

- `style.css` — items 5, 6, 7, 8, 9, 10, 15
- `index.html` — item 8 (gold rule under h3 — markup-side none, just CSS), item 14 reference comment
- `js/render-elements.js` — item 13 (chip role attributes)

## Implementation steps

### 1. Item 5 — drop subtitle italic

`style.css:81`:

```css
/* Was: .hero .subtitle { ... font-style: italic; }
   Italic Be Vietnam Pro renders rough on Linux. Use letter-spacing for emphasis. */
.hero .subtitle { margin: 0.5rem auto 0; max-width: 38ch; color: var(--muted); letter-spacing: 0.15px; }
```

### 2. Item 6 — anchor underline migration (figcaption + credit)

`style.css:123-125` and `style.css:185-188`:

```css
/* Replace border-bottom: 1px dotted with native dotted underline.
   Sub-pixel border at small font sizes can disappear. */
.original-image figcaption a {
  color: var(--accent-ink);
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-color: var(--accent);
  text-underline-offset: 2px;
}
.original-image figcaption a:hover {
  color: var(--gold);
  text-decoration-color: var(--gold);
}
.credit a {
  color: var(--accent-ink);
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-color: var(--accent);
  text-underline-offset: 2px;
  transition: color 0.15s ease, text-decoration-color 0.15s ease;
}
.credit a:hover { color: var(--gold); text-decoration-color: var(--gold); }
```

### 3. Item 7 — h3 letter-spacing reduction

`style.css:161` — change `letter-spacing: 1.2px` → `0.4px` to stop diacritic drift on Vietnamese KIM/MỘC/THUỶ/HOẢ/THỔ.

### 4. Item 8 — h3 size bump + thin gold rule

`style.css:161` and a new rule:

```css
.card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
  letter-spacing: 0.4px;
  font-weight: 700;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid color-mix(in oklch, var(--gold) 60%, transparent);
}
```

### 5. Item 9 — Credit `<ul>` indent

`style.css:184` — change `margin: 0.5rem 0 0.75rem 1.25rem;` → `margin: 0.5rem 0 0.75rem; padding-left: 1.25rem;` so the bullets sit closer to the centred panel content. Or remove `list-style` and lay out as a 2-row stack (decision: keep bullets, just trim outer indent).

### 6. Item 10 — pale chip shape edge

`style.css:232` — bump default border opacity for low-saturation chips. Cleanest universal fix is a slightly stronger border on every colored chip:

```css
.chip {
  /* … unchanged props … */
  border: 1px solid rgba(0, 0, 0, 0.22);
}
```

(Up from 0.18. Helps Rust `#dea584`-class chips read against cream bg without a per-chip rule.)

### 7. Item 13 — chip SR semantics

`js/render-elements.js`:

- In `renderGrid()` (around line 54): set `chips.setAttribute('role', 'list')` after creating the chips wrapper.
- In `buildChip()` (around line 24): set `span.setAttribute('role', 'listitem')`.

### 8. Item 14 — document 5-card-row decision

Add a 1-line comment above `style.css:140`:

```css
/* Grid stays auto-fit (not forced 5-col) — the Ngũ-Hành wheel reads at any
   viewport above 720px without crushing chip names. See plan 260428-1003. */
```

### 9. Item 15 — document AA contrast policy

Add a 1-line comment above `style.css:228` (the `.chip` block):

```css
/* Chip text contrast policy: best-effort via WCAG luminance picker
   (render-elements.js pickTextColor). Worst post-fix case ~3.5:1
   (Swift, MATLAB) is acceptable for decorative chips. */
```

## Todo list

- [ ] Item 5: subtitle italic → letter-spacing
- [ ] Item 6: anchor underline migration (2 selectors)
- [ ] Item 7: h3 letter-spacing 1.2px → 0.4px
- [ ] Item 8: h3 size 1.05rem → 1.2rem + gold rule
- [ ] Item 9: Credit `<ul>` indent fix
- [ ] Item 10: chip border opacity 0.18 → 0.22
- [ ] Item 13: `role="list"` / `role="listitem"` on chip elements
- [ ] Item 14: 5-card-row decision comment
- [ ] Item 15: AA contrast policy comment
- [ ] Manual verify: open `python3 -m http.server 8765`, walk through both views (TIOBE, all-langs) on both sources (GitHub, GitLab) at 1280 / 768 / 375 viewport widths

## Success criteria

- Visual: subtitle no longer italic; anchor underlines render as dotted text-decoration; h3 reads larger with gold rule under each Ngũ Hành label; chip borders visible against page bg on pale chips.
- A11y: NVDA/VoiceOver announces chips as a list with N items per card.
- No console errors, no chip overflow, no layout regressions across 1280/768/375 widths.

## Risks & mitigations

- **Risk:** `text-decoration-style: dotted` renders thicker on Firefox than border-bottom dotted — may visually clash with footer aesthetic. **Mitigation:** if jarring, switch to `text-decoration-style: dashed` or revert to current border-bottom.
- **Risk:** h3 size bump pushes card height enough to break the visual rhythm of the grid. **Mitigation:** reduce h3 size to 1.15rem if too tall.
- **Risk:** chip role attributes change announce verbosity — some SR users prefer no list. **Mitigation:** keep behind a feature flag if anyone complains; otherwise it's the more semantic choice.

## Next steps

→ Phase 02: functional toggles & tooltip (URL persistence, GitLab tooltip, hide empty KIM card in TIOBE view).
