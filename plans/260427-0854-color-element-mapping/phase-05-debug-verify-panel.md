---
title: "Phase 05 (optional) — Debug verify panel for unclassified / borderline cases"
status: pending
priority: P3
effort: 30m
---

## Context Links

- Plan overview: [plan.md](plan.md)
- Phase 02 (panel scaffold): [phase-02-dual-mode-shell.md](phase-02-dual-mode-shell.md)
- Phase 03 (grid render dependency): [phase-03-render-modern-grid.md](phase-03-render-modern-grid.md)
- Phase 04 (parallel-OK): [phase-04-style-polish.md](phase-04-style-polish.md)
- Algorithm reference: [../reports/researcher-260427-0854-nguhanh-color-classifier.md](../reports/researcher-260427-0854-nguhanh-color-classifier.md) §4 edge cases

## Overview

- **Priority:** P3 (optional; ship if time allows)
- **Status:** pending
- **Description:** Add a collapsible `<details>` debug panel inside `#panel-modern` (after the legend, before the disclaimer) that lists (a) skipped languages (no color), (b) borderline-classified languages near hue boundaries. Future contributors can sanity-check classifier output without rerunning the test harness. Modern-only — Classic panel is unaffected.

## Key Insights

- Borderline = classifier is using a "tipping rule" rather than a deep-bucket hue. Concretely: `H ∈ [18, 22)`, `H ∈ [38, 42)`, `H ∈ [68, 72)`, `H ∈ [198, 202)`, `H ∈ [258, 262)`. Width: ±2°. Anything inside = borderline.
- Grayscale bucket is also borderline-prone at `S ∈ [4, 6]` and at `L ∈ [18, 22] / [68, 72]`.
- This panel is for humans, not the build. Hidden by default via `<details>`.
- Reusing `.chip` styles from Phase 04 keeps CSS additions to zero.
- Mount point is **inside `#panel-modern`** only — never inside Classic. Hard rule.

## Requirements

### Functional
- After Modern grid renders, count + list:
  1. **Skipped** (color is null/invalid): show count + a hidden chip list inside `<details>`.
  2. **Borderline** (within ±2° of any hue boundary, OR `S ∈ [4,6]`, OR grayscale `L ∈ [18,22]/[68,72]`): show count + chip list with both the language hex and the assigned element label appended (e.g., `Foo (#a8e0c5 → moc)`).
- Both lists hidden by default; click summary to expand.
- If both lists are empty, hide the entire panel (no `<details>` rendered visibly — set `hidden`).

### Non-functional
- Append to `js/render-elements.js` (do NOT create a new file). Stay under 200 lines total.
- No CSS additions — reuse `.chip` and small text styles.
- Zero performance cost when the panel is collapsed (it's just plain DOM, not lazy).

## Architecture

### Data flow

```
js/main.js (Phase 03)
   │
   ├── classifies all entries
   │       └── also collects:
   │             skipped:    [{name}] (color was null/invalid)
   │             borderline: [{name, color, element}] (HSL near boundary)
   │
   └── renderGrid(...) (existing, into #element-grid)
   └── renderDebugPanel({ skipped, borderline }, mountEl)  ← NEW
        mountEl = document.getElementById('debug-panel')  (inside #panel-modern)
```

### New module additions

```js
// js/render-elements.js (append)
export function renderDebugPanel({ skipped, borderline }, mountEl) { ... }
export function isBorderline(hex) { ... }

// js/main.js (modify)
// extend the per-entry loop to also push to skipped[] and borderline[] arrays
// after renderGrid, call renderDebugPanel(diag, document.getElementById('debug-panel'))
```

### Borderline detector (inline, ≤ 12 lines)

```js
import { hexToHsl } from './classify-element.js';

export function isBorderline(hex) {
  const { h, s, l } = hexToHsl(hex);
  if (s >= 4 && s < 6) return true;            // grayscale tip
  if (s < 5) return l >= 18 && l <= 22 || l >= 68 && l <= 72;
  const boundaries = [20, 40, 70, 200, 260];   // 360-wrap not needed; 0/360 is identical
  return boundaries.some(b => Math.abs(h - b) <= 2);
}
```

### DOM contract (inside #panel-modern)

```html
<section id="panel-modern" role="tabpanel" aria-labelledby="tab-modern" hidden>
  <section class="elements">
    <h2>...</h2>
    <div class="grid" id="element-grid">...</div>
    <p class="legend">...</p>
    <details id="debug-panel" hidden>
      <summary>Kiểm tra tự động (N skipped · M borderline)</summary>
      <h4>Bỏ qua (không có màu)</h4>
      <div class="chips">…skipped chips…</div>
      <h4>Trường hợp ranh giới</h4>
      <div class="chips">…borderline chips…</div>
    </details>
    <p class="disclaimer">...</p>
  </section>
  <details class="original-image">...</details>
</section>
```

The `hidden` attribute on `#debug-panel` is removed by JS only when at least one list is non-empty.

## Related Code Files

### Create
- None.

### Modify
- `js/render-elements.js` — append `renderDebugPanel` + `isBorderline` exports.
- `js/main.js` — collect `skipped` + `borderline` while iterating; call `renderDebugPanel` after `renderGrid`.
- `index.html` — add `<details id="debug-panel" hidden></details>` inside `#panel-modern .elements`, after the `<p class="legend">` and before `<p class="disclaimer">`.

### Delete
- None.

## Implementation Steps

1. In `js/render-elements.js` (append):
   - Import `hexToHsl` from `./classify-element.js`.
   - Add `isBorderline(hex)` per the snippet above.
   - Add `renderDebugPanel({ skipped, borderline }, mountEl)`:
     - If both empty → set `mountEl.hidden = true; return;`.
     - Else build `<summary>` with counts.
     - Build two `.chips` containers; for `skipped`, plain `<span class="chip">name</span>` (no color, default styling); for `borderline`, `<span class="chip" style="background:#hex;color:..." title="#hex → element">{name}</span>`.
     - Set `mountEl.hidden = false`.
2. In `js/main.js`, during the iteration loop:
   - When skipping (null/invalid color) → push `{ name }` to `skipped[]`.
   - After `classify(color)`: if `isBorderline(color)`, push `{ name, color, element }` to `borderline[]`.
   - After `renderGrid`, call `renderDebugPanel({ skipped, borderline }, document.getElementById('debug-panel'))`.
   - Import `isBorderline` and `renderDebugPanel` from `./render-elements.js`.
3. In `index.html`, inside `#panel-modern .elements`, insert `<details id="debug-panel" hidden></details>` between the legend `<p>` and the disclaimer `<p>`.
4. Smoke test: open page, switch to Modern, expand the panel, eyeball the lists. Expected: ~58 skipped (data/markup formats — JSON, YAML, etc.); a small handful of borderline. Verify Classic panel unchanged.

## Todo List

- [ ] Add `isBorderline(hex)` helper in `render-elements.js`
- [ ] Add `renderDebugPanel(...)` exported function
- [ ] Extend `main.js` iteration to collect `skipped` + `borderline`
- [ ] Wire `renderDebugPanel` after `renderGrid`
- [ ] Add `<details id="debug-panel" hidden>` inside `#panel-modern .elements`
- [ ] Verify panel hides when both lists empty
- [ ] Verify "skipped" count ≈ 58 (matches report #1 §5)
- [ ] Verify Classic panel still unchanged (no debug panel leaks across)

## Success Criteria

- Debug panel exists in Modern only and is collapsed by default.
- Expanding shows two sub-sections with counts in `<summary>`.
- Skipped count ≈ 58 (report #1 expectation).
- Borderline list is non-empty but reasonable (say, < 50 entries).
- If you set `data/github-colors.json` to a synthetic dataset with no skipped + no borderline, the `<details>` element stays hidden.
- Classic panel: `#panel-classic` shows no debug panel, no chip clutter.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Borderline count too noisy (>200) | Med | Low | ±2° window already narrow; if too noisy, narrow to ±1° in a follow-up |
| Adding panel changes layout when collapsed | Low | Low | `<details>` collapses to a single line; visually negligible |
| Importing `hexToHsl` re-exposes internals | Low | None | `hexToHsl` is already exported from Phase 01 contract |
| Debug panel mount selector accidentally targets Classic | Low | High | Use `getElementById('debug-panel')`; only Modern has that id (verify in HTML edit) |

## Security Considerations

- Panel content is the same chip/textContent path as Phase 03. No new injection surface.

## Next Steps

- If borderline list reveals systematic issues → revisit classifier rules in `classify-element.js` and update the test cases in `classify-element.test.html` (and report #2 §3).
- This phase is the final one. Mark feature complete after manual review of the panel.
