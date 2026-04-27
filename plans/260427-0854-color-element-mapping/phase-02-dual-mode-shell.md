---
title: "Phase 02 — Dual-mode shell: toggle, panels, hash persistence"
status: pending
priority: P2
effort: 50m
---

## Context Links

- Plan overview: [plan.md](plan.md)
- Next phase (consumes `#panel-modern`): [phase-03-render-modern-grid.md](phase-03-render-modern-grid.md)
- Style polish (toggle CSS): [phase-04-style-polish.md](phase-04-style-polish.md)
- Existing files: `index.html` (current single-view markup), `style.css`

## Overview

- **Priority:** P2 (blocks Phase 03 + 04)
- **Status:** pending
- **Description:** Restructure `index.html` from a single-view page into a two-panel SPA-style page with a segmented Classic / Modern toggle. Move the existing static image + 5 cards verbatim into `#panel-classic`. Scaffold an empty `#panel-modern` that Phase 03 will populate. Add `js/mode-toggle.js` to handle hash-based persistence + keyboard navigation.

## Key Insights

- The 5 published static cards (current `index.html` lines 27–52) and the original image (lines 17–25) are the **canonical Classic content**. They must be moved byte-for-byte; nothing rewritten, nothing reworded. They become the reference comparison view for Modern.
- The toggle is the only new interactive control on the page. Everything else stays static. Keep `mode-toggle.js` minimal — under ~80 lines.
- URL hash is the persistence channel. Hash also enables sharing (`?` query string would mean a separate URL identity per mode and might confuse GH Pages routing — hash is safer).
- Both panels must exist in DOM at all times (locked decision). Toggling `hidden` is preferred over `display:none` in JS because it's both a CSS hook (`[hidden]`) AND a semantic signal to AT.
- Default = Classic. If hash is anything other than `#modern`, render Classic.
- Phase 04 owns the visual styling of the toggle + the panel fade transition. This phase ships a functional but unstyled toggle — that's fine.

## Requirements

### Functional

- Restructure `index.html`:
  - Hero `<header>` unchanged.
  - **New** segmented toggle directly after the hero, before any panel.
  - **`#panel-classic`** wraps the existing `<section class="figure">` (image) + `<section class="elements">` (5 hardcoded cards). Add a small label "(theo bài gốc, 2018)" near the section heading. No content changes inside.
  - **`#panel-modern`** is a sibling section, currently empty except for an h2 heading and the mount points Phase 03 will use (`<div id="element-grid" class="grid"></div>`, `<p class="legend"></p>`, `<p class="disclaimer">…</p>`). Place `<details><summary>Ảnh gốc</summary>…image…</details>` near the bottom (collapsed by default). The image inside is a **second `<img>` tag** with the same `src` — duplication is intentional and KISS-compliant (no JS needed to move the image between panels).
  - Footer credit unchanged.
- Add `<script type="module" src="./js/mode-toggle.js"></script>` before `</body>`.
- `js/mode-toggle.js` responsibilities:
  - On `DOMContentLoaded`: read `location.hash`, normalize (`#modern` → modern, anything else → classic), call `setMode(mode)`.
  - `setMode(mode)` sets `hidden` on the inactive panel, removes from active, updates `aria-selected` + `tabindex` on the two `<button>`s, updates `location.hash` (using `history.replaceState` on initial load to avoid pushing a history entry; `location.hash = ...` on user clicks).
  - Click handler on each tab → `setMode(button.dataset.mode)`.
  - Keyboard handler on the `<div role="tablist">`: `ArrowLeft` / `ArrowRight` move focus between the two buttons and call `setMode` on the newly focused tab (auto-activate; standard tab pattern). `Home` / `End` jump to first / last (only 2 tabs, but harmless). `Enter` / `Space` no-op extra needed since clicking already works.
  - Listen to `hashchange` so browser back/forward + manual hash edits also switch modes.

### Non-functional

- `js/mode-toggle.js` ≤ 90 lines.
- `index.html` total ≤ 130 lines after restructure (currently 78).
- Zero console errors. Zero external requests added.
- No layout shift between Classic load and Modern toggle beyond the natural content swap.
- Works on `file://` (no fetch in this phase).

## Architecture

### DOM contract (post-Phase-02)

```html
<body>
  <main class="page">
    <header class="hero">
      <h1>Lựa chọn ngôn ngữ lập trình theo phong thuỷ</h1>
      <p class="subtitle">Ngũ Hành tương sinh — code cho hợp tuổi, hợp mệnh.</p>
    </header>

    <div class="mode-toggle" role="tablist" aria-label="Chế độ hiển thị">
      <button type="button" role="tab" id="tab-classic" data-mode="classic"
              aria-controls="panel-classic" aria-selected="true" tabindex="0">
        Cổ điển (bài gốc)
      </button>
      <button type="button" role="tab" id="tab-modern" data-mode="modern"
              aria-controls="panel-modern" aria-selected="false" tabindex="-1">
        Hiện đại (tự phân loại)
      </button>
    </div>

    <section id="panel-classic" role="tabpanel" aria-labelledby="tab-classic">
      <!-- existing <section class="figure"> moved here verbatim -->
      <section class="figure">
        <figure>
          <img src="assets/ngon-ngu-lap-trinh-phong-thuy.png" alt="..." />
          <figcaption>Sơ đồ ngôn ngữ lập trình xếp theo Ngũ Hành.</figcaption>
        </figure>
      </section>
      <!-- existing <section class="elements"> moved here verbatim, with label tweak -->
      <section class="elements">
        <h2>Ngũ Hành &amp; ngôn ngữ <small class="mode-tag">(theo bài gốc, 2018)</small></h2>
        <div class="grid">
          <article class="card kim"><h3>KIM</h3><p>JavaScript, Objective-C, Python</p></article>
          <article class="card thuy"><h3>THUỶ</h3><p>C#, PHP</p></article>
          <article class="card moc"><h3>MỘC</h3><p>Android, C#</p></article>
          <article class="card hoa"><h3>HOẢ</h3><p>Scala, HTML5, Java, Node.js</p></article>
          <article class="card tho"><h3>THỔ</h3><p>JavaScript, Go, Ruby</p></article>
        </div>
        <p class="disclaimer">* Bảng phân loại mang tính giải trí, lấy từ ảnh gốc.</p>
      </section>
    </section>

    <section id="panel-modern" role="tabpanel" aria-labelledby="tab-modern" hidden>
      <section class="elements">
        <h2>Ngũ Hành &amp; ngôn ngữ <small class="mode-tag">(tự phân loại theo màu GitHub)</small></h2>
        <div class="grid" id="element-grid"></div>
        <p class="legend"></p>
        <p class="disclaimer">* Phân loại tự động theo màu chính thức GitHub Linguist + quy tắc HSL.</p>
      </section>
      <details class="original-image">
        <summary>Ảnh gốc</summary>
        <figure>
          <img src="assets/ngon-ngu-lap-trinh-phong-thuy.png" alt="Sơ đồ phong thuỷ ngôn ngữ lập trình theo Ngũ Hành" />
          <figcaption>Sơ đồ ngôn ngữ lập trình xếp theo Ngũ Hành.</figcaption>
        </figure>
      </details>
    </section>

    <footer class="credit"><!-- unchanged --></footer>
  </main>
  <script type="module" src="./js/mode-toggle.js"></script>
</body>
```

### Module contract (`js/mode-toggle.js`)

```js
// Public surface: none (self-initialising entry point).
// Side effects: mutates DOM (hidden, aria-selected, tabindex), listens to clicks, keys, hashchange.

const MODES = ['classic', 'modern'];
const DEFAULT_MODE = 'classic';

function readHash() {
  const h = (location.hash || '').replace('#', '');
  return MODES.includes(h) ? h : DEFAULT_MODE;
}

function setMode(mode, { writeHash = true, push = false } = {}) {
  // toggle [hidden] on panels, aria-selected + tabindex on tabs,
  // update hash via history.replaceState (push=false) or location.hash (push=true)
}

function onTabClick(e) { setMode(e.currentTarget.dataset.mode, { push: true }); }
function onTabListKeydown(e) { /* ←/→ Home End cycle + setMode */ }
function onHashChange() { setMode(readHash(), { writeHash: false }); }

document.addEventListener('DOMContentLoaded', () => {
  // wire listeners; initial setMode(readHash(), { writeHash: false })
});
window.addEventListener('hashchange', onHashChange);
```

### Data flow

```
[page load]
   │
   ▼
mode-toggle.js DOMContentLoaded
   ├── readHash() → 'classic' | 'modern'
   └── setMode(mode, { writeHash:false })
         ├── #panel-classic  [hidden=mode!=='classic']
         ├── #panel-modern   [hidden=mode!=='modern']
         ├── #tab-classic    aria-selected, tabindex=0|-1
         └── #tab-modern     aria-selected, tabindex=0|-1

[tab click] → setMode(mode, { push:true }) → location.hash = '#mode'
[hashchange] → setMode(readHash(), { writeHash:false })
[arrow key on tablist] → focus next tab + setMode(...)
```

## Related Code Files

### Create
- `js/mode-toggle.js`

### Modify
- `index.html` — restructure: insert toggle, wrap existing image+cards into `#panel-classic`, add scaffolded `#panel-modern`, add module script tag. **The 5 cards inside `#panel-classic` must be byte-identical copies of current `index.html` lines 30–49.**

### Delete
- None.

## Implementation Steps

1. Open `index.html`. Capture the exact text of lines 17–52 (figure section + elements section) — these blocks move into `#panel-classic` unchanged except for the heading `<small class="mode-tag">` insertion.
2. Replace the body `<main>` content with the structure shown in the DOM contract above:
   - Hero unchanged.
   - Insert `<div class="mode-toggle" role="tablist">` with two buttons.
   - Wrap the captured figure + elements blocks inside `<section id="panel-classic" role="tabpanel" aria-labelledby="tab-classic">`. Add `<small class="mode-tag">(theo bài gốc, 2018)</small>` inside the existing `<h2>`.
   - Add `<section id="panel-modern" role="tabpanel" aria-labelledby="tab-modern" hidden>` with the empty grid mount, legend `<p>`, modern disclaimer, and the `<details><summary>Ảnh gốc</summary>…</details>` block (duplicate `<img>` reusing the same `src`).
   - Footer credit untouched.
3. Add `<script type="module" src="./js/mode-toggle.js"></script>` immediately before `</body>`.
4. Create `js/mode-toggle.js` per the contract:
   - Implement `readHash`, `setMode`, click handler, keydown handler, `hashchange` handler.
   - On `DOMContentLoaded`, call `setMode(readHash(), { writeHash: false })` so initial render does not pollute history.
   - Use `history.replaceState(null, '', '#' + mode)` when `writeHash: true && push: false`, `location.hash = mode` when `push: true`.
   - Arrow key handler: compute next tab index, focus it (`.focus()`), call `setMode` to activate.
5. Smoke test (no server needed for this phase since no `fetch`):
   - Open `index.html` directly. Default view = Classic, image + 5 cards render exactly as before.
   - Click "Hiện đại" — Classic panel disappears, Modern panel appears (empty grid, legend empty, but `<details>Ảnh gốc</details>` is visible and collapsible).
   - Refresh page — URL is `#modern`, Modern persists.
   - Press ← arrow key while a tab has focus — focus and panel switch back to Classic; URL becomes `#classic`.
   - Open `index.html#modern` directly — opens in Modern.
   - Open `index.html#bogus` directly — falls back to Classic.

## Todo List

- [ ] Capture verbatim copy of current `index.html` lines 17–52 for `#panel-classic`
- [ ] Insert toggle markup (`<div role="tablist">` + two `<button role="tab">`)
- [ ] Wrap figure + elements blocks into `#panel-classic` with `mode-tag` heading addition
- [ ] Scaffold `#panel-modern` with empty grid, legend `<p>`, disclaimer, and collapsed `<details>Ảnh gốc</details>` containing duplicate `<img>`
- [ ] Add `<script type="module" src="./js/mode-toggle.js">` before `</body>`
- [ ] Create `js/mode-toggle.js`: `readHash`, `setMode`, tab click handler
- [ ] Add arrow-key navigation (`←`/`→`/`Home`/`End`) on the tablist
- [ ] Add `hashchange` listener for back/forward
- [ ] Verify default = Classic; refresh persistence; deep link `#modern`; invalid hash fallback

## Success Criteria

- `index.html` opens with Classic active by default; image + 5 cards visually identical to pre-Phase-02 state.
- Clicking "Hiện đại" hides classic panel, shows modern panel (still empty pending Phase 03), URL hash becomes `#modern`.
- Refreshing page keeps the active mode.
- Browser back button after a toggle restores previous mode (works because we use `location.hash =` on user clicks).
- `aria-selected` and `tabindex` on the two `<button>`s reflect state at all times.
- Keyboard ←/→ cycles tabs and activates them.
- No console errors. `wc -l js/mode-toggle.js` ≤ 90.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Verbatim copy of static cards drifts (typo introduced during move) | Med | High (acceptance test #1 fails) | Copy block as-is, do not retype. Diff against original commit before merging. |
| Hash collision with future anchor links (`#section-id`) | Low | Med | Reserve `#classic` / `#modern` only; document in mode-toggle.js comment. |
| Loading at `index.html#modern` flashes Classic before swap | Med | Low | Set initial `hidden` on `#panel-modern` in HTML; JS `setMode` runs on `DOMContentLoaded` which fires before paint of dynamic content. If FOUC observed, move the `setMode` call inline-blocking before render. |
| Arrow-key handler steals focus when tabs are not focused | Low | Low | Attach keydown listener to the `<div role="tablist">` element only, not `document`. |
| Duplicate `<img>` in Modern panel double-loads the asset | Low | Low | Browser caches; same `src` resolves to one network request. Acceptable. |
| Browser ignores `<script type="module">` on `file://` (Firefox/old Chrome) | Low | Med | README already recommends `python3 -m http.server`. Document the limitation in commit body. |

## Security Considerations

- No user input is taken anywhere. Hash value is normalized against an allowlist (`MODES`) before any DOM mutation — no injection vector.
- All DOM mutations use property assignment (`el.hidden`, `el.setAttribute`, `el.tabIndex`); no `innerHTML`.
- Static file additions only.

## Next Steps

- Phase 03 mounts the dynamic grid into `#panel-modern .grid` (already scaffolded here) and populates the legend `<p>`.
- Phase 04 adds the visual styling of the toggle (segmented control look, focus ring, fade transition between panels).
- Phase 05 (optional) appends a `<details id="debug-panel">` inside `#panel-modern` after the legend.
