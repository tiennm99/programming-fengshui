---
title: "Phase 03 — Render dynamic element grid into #panel-modern"
status: pending
priority: P2
effort: 45m
---

## Context Links

- Plan overview: [plan.md](plan.md)
- Phase 01 (classifier dependency): [phase-01-data-and-classifier.md](phase-01-data-and-classifier.md)
- Phase 02 (panel scaffold dependency): [phase-02-dual-mode-shell.md](phase-02-dual-mode-shell.md)
- Style polish (consumes the chip markup produced here): [phase-04-style-polish.md](phase-04-style-polish.md)
- Existing files: `index.html` (post-Phase-02, with `#panel-modern .grid` scaffolded), `style.css` (existing `.card.kim/.thuy/.moc/.hoa/.tho`)

## Overview

- **Priority:** P2
- **Status:** pending
- **Description:** Populate the empty grid in `#panel-modern` (created by Phase 02) with 5 cards driven by `data/github-colors.json` and the Phase 01 classifier. Each card lists its languages as colored chips. Modern-only — Classic panel stays untouched. The collapsed `<details>Ảnh gốc</details>` block already exists in markup; this phase does not modify it.

## Key Insights

- Mount point is `#panel-modern .grid` (i.e. `document.getElementById('element-grid')`), **not** the legacy `<section class="elements">` block — that selector now exists inside both panels and only the Modern one should be populated by JS.
- The Classic cards (`#panel-classic .grid`) are static and must not be touched by this phase. This is a hard rule — JS queries by id, not by class, to avoid accidentally hitting Classic.
- Original image, hero, footer credit must stay byte-identical (Phase 02 already kept them so).
- Chips must be readable on their own background → compute YIQ contrast at render time and pick black or white text. Only branching needed for accessibility (WCAG-ish).
- Alphabetical sort is the only natural default; "popularity" is not in the JSON. YAGNI on ranking.
- Module loading on `file://` is restricted in some browsers (e.g. Chrome blocks `fetch` of local JSON). Document `python3 -m http.server 8080` in README — already present.
- Render runs on every page load regardless of active mode. Cost is acceptable (~664 chips into a hidden DOM node), and avoids a re-render race when the user switches to Modern.

## Requirements

### Functional
- On page load (`DOMContentLoaded`), fetch `./data/github-colors.json`.
- Filter entries with non-null, valid hex `color` (regex `/^#[0-9a-fA-F]{6}$/`).
- For each language: call `classify(color)` → bucket into one of 5 element groups.
- Sort each bucket alphabetically by language name (case-insensitive).
- Render 5 cards into `#element-grid` (KIM, MỘC, THUỶ, HOẢ, THỔ in that order). Each card shows:
  - Heading (existing `<h3>` style)
  - Language count: `<small class="card-count">123 ngôn ngữ</small>`
  - Chip list: `<div class="chips">` containing one `<span class="chip" style="background:#hex; color:[black|white]" title="#hex">LangName</span>` per language.
- Skipped languages (null/invalid color): not rendered. No "unknown" bucket.
- Populate `<p class="legend">` (the empty `<p>` already in the markup) with the rule summary: `"Phân loại theo tông màu HSL: đỏ/tím/cam đậm → HOẢ, xanh lá/cyan → MỘC, xanh dương → THUỶ, vàng/nâu → THỔ, trắng/xám sáng → KIM."`
- Disclaimer paragraph already exists in the Modern panel markup; do not touch.
- The `<details>Ảnh gốc</details>` element exists in markup from Phase 02; this phase does not modify it.

### Non-functional
- File size budget: `js/render-elements.js` ≤ 130 lines, `js/main.js` ≤ 60 lines.
- Render must complete <100ms on a typical laptop (664 chips is trivial DOM work).
- No console errors. No external network requests at runtime (only relative-path fetch to vendored JSON).
- Graceful failure: if fetch fails, replace the legend `<p>` text and prepend an inline `.render-error` element inside `#panel-modern .elements` section. Do not break the rest of the page or affect Classic mode.

## Architecture

### Data flow

```
[page load]
   │
   ▼
js/main.js  (DOMContentLoaded)
   ├── fetch('./data/github-colors.json')
   │       │
   │       ▼ (resolved to colors object)
   │   ┌────────────────────────────┐
   │   │ for each [name, {color}]:  │
   │   │   if !color → skip         │
   │   │   element = classify(color)│  (from classify-element.js)
   │   │   buckets[element].push(…) │
   │   └────────────────────────────┘
   │
   └──▶ render-elements.js: renderGrid(buckets, mountEl)
                            └─ writes 5 cards into #element-grid (inside #panel-modern)
   └──▶ sets legend text on document.querySelector('#panel-modern .legend')
```

### DOM contract (the markup this phase mounts into — created by Phase 02)

```html
<section id="panel-modern" role="tabpanel" aria-labelledby="tab-modern" hidden>
  <section class="elements">
    <h2>Ngũ Hành &amp; ngôn ngữ <small class="mode-tag">(tự phân loại theo màu GitHub)</small></h2>
    <div class="grid" id="element-grid"><!-- this phase populates --></div>
    <p class="legend"><!-- this phase populates --></p>
    <p class="disclaimer">* Phân loại tự động theo màu chính thức GitHub Linguist + quy tắc HSL.</p>
  </section>
  <details class="original-image">
    <summary>Ảnh gốc</summary>
    <figure>
      <img src="assets/ngon-ngu-lap-trinh-phong-thuy.png" alt="..." />
      <figcaption>Sơ đồ ngôn ngữ lập trình xếp theo Ngũ Hành.</figcaption>
    </figure>
  </details>
</section>
```

This phase **does not** modify `index.html`.

### Module contracts

```js
// js/render-elements.js
export function renderGrid(buckets, mountEl)
// buckets: { kim: [{name, color}], moc: [...], thuy: [...], hoa: [...], tho: [...] }
// mountEl: HTMLElement to render cards into (#element-grid)

export function renderError(message, mountEl)
// inline error fallback; mountEl is the .elements <section> inside #panel-modern

// js/main.js (entry)
// 1. fetch JSON
// 2. classify into buckets
// 3. call renderGrid(buckets, document.getElementById('element-grid'))
// 4. set legend text on document.querySelector('#panel-modern .legend')
// 5. on error: renderError into document.querySelector('#panel-modern .elements')
```

### Contrast helper

Inline in `render-elements.js` (≤ 6 lines):
```js
// YIQ-based: returns 'black' or 'white'
function pickTextColor(hex) {
  const r = parseInt(hex.slice(1,3),16),
        g = parseInt(hex.slice(3,5),16),
        b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114) / 1000 >= 128 ? 'black' : 'white';
}
```

## Related Code Files

### Create
- `js/render-elements.js`
- `js/main.js`

### Modify
- None. (`index.html` already has the mount points from Phase 02.)

### Delete
- None.

## Implementation Steps

1. Create `js/render-elements.js`:
   - Implement `pickTextColor(hex)` helper.
   - Implement `renderGrid(buckets, mountEl)`:
     - Build `DocumentFragment`. For each `{key, label}` in `ELEMENTS`:
       - `<article class="card ${key}">` with `<h3>${label}</h3>`, `<small class="card-count">${langs.length} ngôn ngữ</small>`, and `<div class="chips">` containing one `<span class="chip">` per language. Use `textContent = name` (never `innerHTML`); set `style.background = color; style.color = pickTextColor(color); title = color`.
     - Clear `mountEl` (`mountEl.replaceChildren(fragment)`).
   - Implement `renderError(msg, mountEl)` → prepend `<p class="render-error">${msg}</p>` to `mountEl`.
   - Export `renderGrid`, `renderError`. Import `ELEMENTS` from `./classify-element.js`.
2. Create `js/main.js`:
   - Import `classify`, `ELEMENTS` from `./classify-element.js`, and `renderGrid`, `renderError` from `./render-elements.js`.
   - On `DOMContentLoaded`:
     - `fetch('./data/github-colors.json')` → `.json()`.
     - Build `buckets = { kim:[], moc:[], thuy:[], hoa:[], tho:[] }`.
     - Iterate entries: skip if `color` null or fails `/^#[0-9a-fA-F]{6}$/`. Otherwise push `{name, color}` into `buckets[classify(color)]`.
     - Sort each bucket alphabetically (case-insensitive `localeCompare`).
     - `renderGrid(buckets, document.getElementById('element-grid'))`.
     - Set legend: `document.querySelector('#panel-modern .legend').textContent = "Phân loại theo tông màu HSL: đỏ/tím/cam đậm → HOẢ, xanh lá/cyan → MỘC, xanh dương → THUỶ, vàng/nâu → THỔ, trắng/xám sáng → KIM."`
   - Wrap in try/catch → on failure call `renderError(msg, document.querySelector('#panel-modern .elements'))`.
   - Add module script tag to `index.html`? **No** — Phase 02 added `js/mode-toggle.js`. Add a second tag `<script type="module" src="./js/main.js"></script>` before `</body>`. *Correction: this is the only `index.html` edit this phase makes — adding the second `<script type="module">` line.* Update file ownership accordingly.
3. Edit `index.html` (one line): add `<script type="module" src="./js/main.js"></script>` immediately after the existing `<script type="module" src="./js/mode-toggle.js"></script>`.
4. Local smoke test: `python3 -m http.server 8080`, open `http://localhost:8080`, switch to Modern via toggle, confirm:
   - Modern grid: 5 cards render with chips
   - JavaScript chip is yellow with black text and lives under THỔ
   - Python chip is blue with white text under THUỶ
   - C# chip is green under MỘC
   - Classic panel still shows verbatim 5 cards from the 2018 mapping (untouched)
   - `<details>Ảnh gốc</details>` expands and shows the original image
   - No console errors

## Todo List

- [ ] Create `js/render-elements.js` with `renderGrid`, `renderError`, contrast helper
- [ ] Create `js/main.js` entry point (fetch + classify + render into `#element-grid`)
- [ ] Set legend text on `#panel-modern .legend`
- [ ] Add `<script type="module" src="./js/main.js">` to `index.html`
- [ ] Smoke test via `python3 -m http.server 8080` in both modes
- [ ] Verify the 12 sample languages from report §3 land in expected elements (Modern panel)
- [ ] Verify Classic panel unchanged

## Success Criteria

- Modern panel: all 5 cards render with ≥5 chips each.
- Each chip has `style="background:#hex; color:black|white"` and `title="#hex"`.
- Sample language placement matches Phase 01 acceptance list (12 languages).
- Total Modern render time <100ms (eyeball; no flash of empty content beyond network latency).
- Classic panel: visually identical to post-Phase-02 state — JavaScript/Objective-C/Python in KIM card, etc.
- View-source after switching to Modern shows populated chip markup inside `#element-grid`.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `fetch('./data/...')` fails on `file://` (Chrome) | High | Med | Document `python3 -m http.server` in README (already done); show inline error if it happens (does not affect Classic mode) |
| 600+ chips cause horizontal scroll on mobile | Med | Med | Phase 04 handles wrap + chip sizing |
| `getElementById('element-grid')` collides with Classic if Phase 02 misnamed the Classic grid | Med | High | Phase 02 contract: only `#panel-modern .grid` carries `id="element-grid"`. Verify before Phase 03 starts. |
| Sort by name puts emoji/Unicode names oddly | Low | Low | `localeCompare` default is fine. |
| Module script load order: `main.js` runs before `mode-toggle.js` finishes | Low | Low | Both listen to `DOMContentLoaded`; order is irrelevant. Each operates on disjoint DOM nodes. |

## Security Considerations

- All chip text comes from JSON keys; the JSON is vendored from a trusted source. Still, set `chipEl.textContent = name` (never `innerHTML`) — defends against malformed entries.
- Style attribute uses validated hex only (regex-checked in `main.js`). No CSS injection vector.
- No `eval`, no `innerHTML` with interpolation.
- This phase only writes inside `#panel-modern`; Classic panel is read-never-write.

## Next Steps

- Phase 04 styles the chips for readability + responsive flow + the toggle / panel transition CSS.
- Phase 05 (optional) appends a debug panel inside `#panel-modern` listing skipped + borderline languages.
