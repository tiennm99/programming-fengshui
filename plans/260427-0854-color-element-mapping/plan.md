---
title: "Dual-mode (Classic / Modern) Ngũ Hành language page"
description: "Toggle between the published 2018 mapping and an HSL-classifier-driven dynamic grid."
status: pending
priority: P2
effort: 3h45m
branch: main
tags: [static-site, frontend, classifier, dual-mode, gh-pages]
created: 2026-04-27
---

## Goal

Extend `index.html` from a single static view into a dual-mode page: **Classic** (the 2018 published image + 5 hardcoded cards, verbatim) and **Modern** (collapsed source image + dynamic grid driven by GitHub Linguist colors classified into 5 Ngũ Hành elements via deterministic HSL rules). No build step. Single SPA, vanilla ES modules, deployed via existing GH Pages workflow.

## Modes

| Mode | Purpose | Contents |
|------|---------|----------|
| **Classic** *(default)* | Faithful reproduction of the 2018 source | Full-size original image + 5 hardcoded element cards (JS/Obj-C/Python in KIM, etc.) labelled "(theo bài gốc, 2018)" |
| **Modern** | Value-add extension | Dynamic grid + legend rendered from `data/github-colors.json` via classifier; original image collapsed into `<details>Ảnh gốc</details>` near bottom |

**Default = Classic.** Persisted via URL hash (`#classic` / `#modern`); shareable, no localStorage. Both panels live in the DOM at all times; toggle sets `hidden` on the inactive one with a CSS opacity fade.

## Architectural decisions (locked)

- **Toggle UI:** segmented control, two `<button role="tab">` inside `<div role="tablist">`. Keyboard: ←/→ cycle, Enter/Space activate. Placed between hero and panels.
- **Persistence:** URL hash only. Read on load; write on click. Invalid/missing → Classic.
- **Single DOM, two panels:** `#panel-classic` + `#panel-modern`, both `role="tabpanel"`. Toggle never re-renders.
- **Data source:** vendor `data/github-colors.json` from `ozh/github-colors`. `fetch('./data/github-colors.json')` (relative, same-origin, offline-friendly).
- **Module strategy:** vanilla ES modules; no bundler, no npm.
- **Classifier contract:** pure `classify(hex) → 'kim'|'moc'|'thuy'|'hoa'|'tho'` (lowercase to match existing CSS classes).
- **Animation:** CSS `opacity` transition only.
- **Out of scope:** framework, build tooling, npm install, GitHub API, popularity ranking, search, filter, dark mode, localStorage, tests beyond classifier harness.

## Phases

| # | File | Status | Effort | Owner files |
|---|------|--------|--------|-------------|
| 01 | [phase-01-data-and-classifier.md](phase-01-data-and-classifier.md) | pending | 60m | `data/github-colors.json` (new), `js/classify-element.js` (new), `js/classify-element.test.html` (new) |
| 02 | [phase-02-dual-mode-shell.md](phase-02-dual-mode-shell.md) | pending | 50m | `index.html` (restructure), `js/mode-toggle.js` (new) |
| 03 | [phase-03-render-modern-grid.md](phase-03-render-modern-grid.md) | pending | 45m | `js/render-elements.js` (new), `js/main.js` (new) |
| 04 | [phase-04-style-polish.md](phase-04-style-polish.md) | pending | 35m | `style.css` (modify) |
| 05 | [phase-05-debug-verify-panel.md](phase-05-debug-verify-panel.md) | pending (optional) | 30m | `js/render-elements.js` (modify), `index.html` (modify, modern panel only) |

Total: 3h10m core, +30m optional.

## Dependency graph

```
phase-01 ──▶ phase-03 ──┬──▶ phase-04
                        └──▶ phase-05 (optional)
phase-02 ──▶ phase-03
phase-02 ──▶ phase-04 (toggle/panel CSS)
```

Phase 02 is independent of Phase 01 but blocks Phase 03 (provides `#panel-modern` mount). Phase 04 needs both Phase 02 (toggle markup) and Phase 03 (grid markup) to exist.

## File ownership (no overlap between concurrent phases)

- Phase 01 owns: `data/`, `js/classify-element.js`, `js/classify-element.test.html`
- Phase 02 owns: `index.html` (full restructure: hero stays, classic panel wraps the existing image+cards, modern panel scaffolded empty, toggle inserted), `js/mode-toggle.js`
- Phase 03 owns: `js/render-elements.js`, `js/main.js`. Reads `#panel-modern .grid` (created by Phase 02). Does **not** edit `index.html`.
- Phase 04 owns: `style.css` (toggle, panel transitions, chip, legend, responsive)
- Phase 05 owns: appends to `js/render-elements.js`, adds `<details id="debug-panel">` inside `#panel-modern` only

`index.html` is touched by Phase 02 (structural) and Phase 05 (debug mount inside `#panel-modern`) — sequential, no overlap.

## Acceptance criteria (whole feature)

1. Page loads at `index.html` with **Classic** mode active by default; original image full-size and the 5 published-mapping cards (JS/Obj-C/Python in KIM, C#/PHP in THUỶ, Android/C# in MỘC, Scala/HTML5/Java/Node.js in HOẢ, JS/Go/Ruby in THỔ) render verbatim.
2. Clicking **Modern** toggle: classic panel hides, modern panel shows; dynamic grid populated by classifier with ≥5 chips per element; original image visible only after expanding `<details>Ảnh gốc</details>`.
3. URL hash updates to `#classic` / `#modern` on toggle. Refreshing the page restores the active mode. Sharing the URL with `#modern` opens directly in Modern.
4. Keyboard: Tab focuses the toggle; ←/→ cycle between tabs; Enter/Space activates the focused tab; `aria-selected` reflects state.
5. The 12 sample languages classify deterministically per the HSL rules (algorithm-verified): JS→THỔ, Python→THUỶ, Rust→THỔ, Go→MỘC, Ruby→HOẢ, Java→THỔ, C#→MỘC, TS→THUỶ, PHP→THUỶ, Swift→HOẢ, Kotlin→KIM, HTML→HOẢ. (Note: Rust/Java moved to THỔ vs report §3's preliminary table because their orange-brown hues fall below the L≥50 / S≥60 brightness gate that promotes [20,40) hues to HOẢ; Go moves to MỘC because its cyan hue H≈192 sits in the [70,200) MỘC range per the locked rule "MỘC covers green + jade/cyan"; Kotlin lands in KIM under the L≥70 "metallic shine" rule introduced 2026-04-27 to rebalance the empty KIM bucket.)
6. Languages with `color: null` are absent from the Modern grid.
7. Hero, footer credit unchanged. No console errors. No external network requests at runtime.
8. `js/classify-element.test.html` opens in browser and prints PASS for all 22 cases.

## Rollback

Phase commits revert in reverse order (05 → 04 → 03 → 02 → 01). **Phase 02 is the only destructive change to `index.html`** (restructures the published markup into panels). The full pre-Phase-02 markup must be quoted verbatim in the Phase 02 commit body for restoration. After Phase 02 revert, Classic mode markup must reappear as the original single-view layout with no toggle.

## Unresolved questions

1. Cap on chips per element in Modern? Default = show all alphabetical. Confirm if too noisy after first render.
2. Should hash changes via browser back/forward animate the panel switch? Default = yes (same `hashchange` listener).
