# Phase 03 — Additive features

## Context

Items 11 (Top-5 non-TIOBE peek in TIOBE view) and 12 (subtle Lunar-New-Year SVG body texture). Both additive — they enhance the page without changing existing behaviour. Lower priority than Phase 02; defer if time-constrained.

## Overview

- **Priority:** P3 (additive)
- **Status:** pending — depends on Phase 02
- **Effort:** ~45 min for Top-5 peek (incl. data math), ~20 min for SVG texture (incl. opacity tuning)
- **Risk:** low — all changes are additive; can revert without breaking core flow

## Files modified

- `js/main.js` — compute "popularity rank" proxy (alphabetical for now; no real popularity signal in data)
- `js/render-elements.js` — add peek slot to chip rendering
- `style.css` — peek styling (dimmed chips), body bg SVG
- `assets/lunar-pattern.svg` — new file (small, ~1 KB)

## Implementation steps

### Item 11 — Top-5 non-TIOBE peek

In TIOBE view, each card currently shows just its TIOBE-ranked chips. Peek = show 5 dimmed non-TIOBE chips beside the pinned ones, alphabetical (no popularity data in our JSON). User can read them but the visual hierarchy stays TIOBE-first.

**1. `js/main.js` — pre-compute peek list per bucket** (after `classifyAll`, before `applySortAndRender`):

```js
const PEEK_COUNT = 5;

function annotatePeeks(buckets) {
  for (const langs of Object.values(buckets)) {
    const nonTiobe = langs.filter((l) => !l.rank);
    nonTiobe.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    const peekSet = new Set(nonTiobe.slice(0, PEEK_COUNT).map((l) => l.name));
    for (const l of langs) {
      if (!l.rank && peekSet.has(l.name)) l.peek = true;
    }
  }
}
```

Call `annotatePeeks(buckets)` right after `classifyAll(data)` resolves.

**2. `js/render-elements.js` — emit `chip-peek` class:**

```js
function buildChip(name, color, { rank = null, peek = false } = {}) {
  const span = document.createElement('span');
  let cls = 'chip';
  if (rank) cls += ' chip-tiobe';
  else if (peek) cls += ' chip-peek';
  else cls += ' chip-other';
  span.className = cls;
  /* … rest unchanged … */
}
```

And in `renderGrid()` (around line 56):

```js
for (const { name, color, rank, peek } of langs)
  chips.appendChild(buildChip(name, color, { rank, peek }));
```

**3. `style.css` — peek visibility rule** (after the existing `.elements .chip-other` line):

```css
/* Peek: in TIOBE view, surface 5 alphabetical non-TIOBE chips per card,
   dimmed so they don't compete with the pinned TIOBE entries. */
.elements .chip-peek { display: inline-flex; opacity: 0.55; }
.elements.show-all .chip-peek { opacity: 1; }
```

### Item 12 — Lunar SVG body texture

A faint cloud / 雲紋-style repeating pattern at low opacity. Hand-craft a small inline-able SVG so we don't add a binary asset.

**1. New file `assets/lunar-pattern.svg`** — a 120×120 pattern of stylised cloud/wave curves:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <g fill="none" stroke="#c79b3c" stroke-width="0.8" stroke-linecap="round" opacity="0.6">
    <path d="M5,20 Q15,10 25,20 T45,20 T65,20 T85,20 T105,20" />
    <path d="M5,55 Q15,45 25,55 T45,55 T65,55 T85,55 T105,55" />
    <path d="M5,90 Q15,80 25,90 T45,90 T65,90 T85,90 T105,90" />
    <circle cx="30" cy="35" r="2" />
    <circle cx="75" cy="70" r="2" />
    <circle cx="100" cy="40" r="2" />
  </g>
</svg>
```

(Tune curves and dot positions to taste.)

**2. `style.css:46-53` — body bg layering** (extend existing radial gradient):

```css
body {
  font-family: var(--font-sans);
  background:
    url('./assets/lunar-pattern.svg') repeat,
    radial-gradient(1200px 600px at 50% -120px, #fff5dd 0%, transparent 60%),
    var(--bg);
  background-size: 120px 120px, auto, auto;
  /* SVG already has 0.6 internal opacity on stroke; this layering puts
     it at ~3% effective contrast against cream — barely visible, sets
     the lunar-new-year mood without distracting. */
  color: var(--fg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

Tune the SVG `opacity` attribute or stroke colour if too prominent.

## Todo list

- [ ] Item 11: `annotatePeeks()` helper + integration into `loadAndRender`
- [ ] Item 11: `buildChip` accepts `peek` flag; emits `chip-peek` class
- [ ] Item 11: CSS rule for `.chip-peek` (visible-dimmed in TIOBE, full in all-langs)
- [ ] Item 12: hand-craft `assets/lunar-pattern.svg` (~1 KB)
- [ ] Item 12: layer SVG into `body` background per CSS above
- [ ] Manual verify: TIOBE view shows TIOBE chips at full strength + 5 peek chips dimmed
- [ ] Manual verify: all-langs view restores all chips at full opacity (no regression)
- [ ] Manual verify: SVG bg renders at desktop / mobile, doesn't fight text contrast (still WCAG AA)
- [ ] Manual verify: print stylesheet — page still readable (SVG should drop or stay subtle)

## Success criteria

- TIOBE cards show ~9–12 chips each (4–7 TIOBE pinned + 5 peek), no overflow.
- Peek chips are clearly secondary (lower opacity) but readable.
- Body bg has a faint lunar-new-year pattern; cream + accent red read unchanged.
- No measurable contrast regression (page bg still ≥7:1 against `--fg`).

## Risks & mitigations

- **Risk:** No popularity signal in `data/*.json` — alphabetical peek may surface obscure langs (e.g. "Apex" before "Ada"). **Mitigation:** alphabetical is honest; users get a deterministic preview. Future: rank by GitHub language usage data if added.
- **Risk:** SVG bg slows page paint. **Mitigation:** SVG is <1 KB, repeats natively in CSS; no JS cost.
- **Risk:** SVG visible at low-vision-mode / high contrast. **Mitigation:** wrap in `@media (prefers-contrast: more) { body { background-image: none; } }` if needed.
- **Risk:** Peek chips visually lift cards taller — KIM card with 0 TIOBE + 5 peek = 5 small chips. **Mitigation:** with Phase 02 item 4 hide-empty logic, KIM TIOBE bucket count goes from 0 to 5 (peek), so it's no longer empty — card now shows. Reconcile: the hide rule should check `langs.length === 0` AFTER peek annotation, not before. Adjust Phase 02 step 4 if peek shipped: filter on `langs.filter(l => l.rank || l.peek).length === 0` in TIOBE view, OR change Item 4 to "hide if no TIOBE rank langs AND not show-all" — explicit. Recommend: in TIOBE view, hide a card only if it has zero TIOBE chips, regardless of peek (so KIM stays hidden in TIOBE view; peek alone doesn't justify a card).

## Next steps

→ Phase 04: OG social card image generation (independent — can run before or in parallel).
