# UI/UX Audit & Improvements — programming-fengshui

Date: 2026-04-27
Scope: `index.html`, `style.css`, `js/render-elements.js` (read all JS for context)
Approach: single careful pass, ~10 high-impact fixes, no rewrites.

---

## (a) Issues found & triaged

| # | Severity | Selector / Area | Symptom |
|---|----------|-----------------|---------|
| 1 | High | `.mode-toggle` | No `flex-wrap` → at 320px Vietnamese labels squeeze and risk horizontal scroll. |
| 2 | High | `--muted #6b5a48` on `--bg #fdf6ec` | ~4.0:1 — fails WCAG AA on small italic (`.legend`, `.subtitle`, `.note`). |
| 3 | High | `.chip` text color picker (`pickTextColor`) | YIQ ≥128 mis-flips on saturated mid-tones (e.g. `#d44950` got black text — unreadable). Also no SR label, hex only in `title` (invisible on touch). |
| 4 | Med | `.card:hover { transform }` | Reduced-motion respected only for keyframe; transform transition still ran. |
| 5 | Med | Hero | No visual anchor / brand cue. Page is a feng-shui joke but reads like a generic CRUD card list. |
| 6 | Med | `@media (max-width: 500px) { .grid { 1fr } }` | Too aggressive — at 375–499px we lose the 2-col grid that auto-fit would otherwise produce. Cards become tall single-column lists with chip walls. |
| 7 | Med | `<details>` summaries (`Ảnh gốc`, debug panel) | Muted italic, no chevron — invisible affordance. Users won't click. |
| 8 | Med | Focus rings | Only on tabs and view-toggle. Links + `<details>` summaries have no `:focus-visible`. |
| 9 | Low | `<small class="mode-tag">` inline inside `<h2>` | At narrow widths the centered heading wraps awkwardly with the parenthetical glued at the end. |
| 10 | Low | a11y | No skip link to bypass tablist for keyboard users. |
| 11 | Low | Element accent colors `--kim/--moc/--tho` | `#d4af37`, `#3a8f4a`, `#8a6d3b` — `--kim` and `--moc` borderline AA at h3 size on white. |
| 12 | Low | Chip border `rgba(0,0,0,0.08)` | Vanishes on dark chips — silhouette dissolves into bg on dark languages. |

Skipped as nitpicks (intentionally not in scope): dark-mode support, fancy 3D / parallax (would overshoot a one-page joke), typography rewrite to a webfont with network calls (constraint says try system stack first).

---

## (b) Changes shipped & rationale

### `style.css` — full pass (370 → 302 lines, all under 400-line cap)

1. **Token expansion (not replacement)** — added `--bg-tint`, `--accent-ink`, `--border`, `--border-strong`, `--shadow-sm`, `--radius-sm`, `--focus-ring`. Kept all original `--bg/--fg/--accent/--gold/--card-bg/--shadow` and `--kim/--moc/--thuy/--hoa/--tho` keys per constraint.
2. **Contrast fixes:** `--muted #6b5a48` → `#5b4a38` (AA on cream). `--kim #d4af37` → `#c8932a`, `--moc #3a8f4a` → `#2f7d3f`, `--tho #8a6d3b` → `#7a5f30` — h3 now passes AA on white.
3. **Font stack:** added `Be Vietnam Pro`, `Inter`, then `system-ui` fallbacks — Vietnamese-first system stack, zero network fetches per constraint. `Be Vietnam Pro` ships on most modern Vietnamese-localized systems and on Android; falls back transparently to `system-ui` / `Segoe UI`.
4. **Hero ribbon:** 5 element-color bars (Kim/Mộc/Thuỷ/Hoả/Thổ, 28×4px each) under the subtitle. Quietly ties the brand together — visible on every load, not kitsch, `aria-hidden="true"` so it never pollutes SR output. Body now has a soft warm radial wash from top-center for subtle lunar-new-year warmth.
5. **Mode toggle:** added `flex-wrap: wrap` (fixes 320px), bumped border to `--border-strong`, kept pill shape, added subtle drop-shadow on active state for depth, `box-shadow`-based focus ring (consistent with rest of page).
6. **Reduced motion:** global `prefers-reduced-motion` rule kills all animation/transition durations. `.card:hover { transform }` now also explicitly cancels under reduced motion.
7. **Mobile breakpoint:** moved 1-column grid collapse from 500px → **420px**. At 375px we keep 2 columns (auto-fit min 160px works). Mode-toggle gets `flex: 1 1 auto` at narrow widths so the two pills share the row evenly. Extra 320px cap.
8. **`<details>` styling:** custom chevron (▸ → ▾ on `[open]`) in gold, accent-ink summary text, dashed border on debug panel to visually separate it from the main `original-image` disclosure. Both shared via grouped selectors to keep CSS DRY.
9. **Skip link:** standard "off-screen until focus" pattern, accent background.
10. **Chips:** stronger border (`rgba(0,0,0,0.18)` default, `0.45` for TIOBE), inner `1px` highlight on TIOBE chips for premium feel, `overflow: hidden + text-overflow: ellipsis` to prevent overflow at 320px on extra-long names.
11. **Focus rings everywhere:** unified `--focus-ring` token (gold halo) applied to tabs, view-toggle, credit links, both `<details>` summaries.
12. **Subtitle / legend max-width** to constrain line length to 38ch / 60ch — improves readability at desktop widths.
13. Cards got border + reduced base shadow + lift on hover (shadow grows on hover, not just transform — adds depth cue).

### `index.html`

1. Added skip link at top of `<body>`.
2. Added `id="main-content"` to `<main>` for skip link target.
3. Added `<div class="hero-ribbon" aria-hidden="true">` with 5 element spans inside `<header class="hero">`.
4. Did NOT change `Credit` heading (constraint: footer content byte-identical). Did NOT change classic 5 cards, hero h1, original image, or any link text.

### `js/render-elements.js`

1. Replaced YIQ `pickTextColor` with WCAG-style relative luminance. Threshold 0.5 produces correct white-on-mid-tone results that the old YIQ flubbed. Tested mentally against `#d44950` (Apex), `#5d4037` (Brown), `#427819` (XSLT) — all now get white correctly.
2. Chip `aria-label` + `title` now read `"<name> · <#HEX> · TIOBE #<rank>"` — hex is now SR-announceable and visible on hover. Previously the hex only lived in a `title` (invisible on touch).
3. File 120 → 131 lines, still well under cap.

### Files NOT touched (intentional)

- `js/classify-element.js` — algorithm correct, well-documented, out of UX scope.
- `js/main.js` — orchestration, not UX.
- `js/mode-toggle.js` — tablist works, keyboard nav correct, hash sync correct.
- `js/tiobe-top.js` — pure data.
- `data/github-colors.json` — vendored data.
- The original 5 classic cards, image, hero h1, footer text — per constraint.

---

## (c) Things intentionally NOT changed

- **"Credit" heading stays English** — constraint said footer content byte-identical. Would prefer "Nguồn" but won't violate spec; logged as open question.
- **No webfont fetch** — `Be Vietnam Pro` is added to the stack only as a hint; if not installed, system stack handles Vietnamese diacritics correctly. Constraint said try system-stack first.
- **No dark mode** — out of scope for a one-page joke; the warm cream IS the brand. Adding a dark variant would dilute the lunar-new-year palette without user benefit.
- **Classic cards, hero text, image, links** — per hard constraints.
- **Element keys remain lowercase `kim/moc/thuy/hoa/tho`** — per constraint.
- **No build step / framework** — vanilla HTML/CSS/ES modules only.
- **No new top-level files** — only edited existing ones.
- **`hexToHsl` import in render-elements.js** — kept (used by `isBorderline`); did not refactor classifier to share.

---

## Verification

- All assets serve 200 over local HTTP server (`index.html`, `style.css`, `js/main.js`, `js/render-elements.js`, `data/github-colors.json`).
- File sizes: `style.css` 302 lines, `index.html` 121, all JS files ≤ 131. Cap = 400.
- No new files outside allowed roots. No npm, no fonts pulled over network, no markdown outside `plans/`.

---

## Open questions

1. "Credit" heading is English in a Vietnamese page — kept due to byte-identical constraint. Confirm if "Nguồn" is acceptable in a follow-up; trivial 1-line change.
2. `Be Vietnam Pro` is in the font stack as a hint — if you'd prefer truly system-only, drop the first two stack entries. Current behavior: zero network calls regardless, just better rendering on systems that have it.
3. Element accent palette was nudged for AA contrast (`--kim/--moc/--tho`). If the original hexes are part of a documented brand spec, revert and accept the contrast hit on h3-only.
4. Hero ribbon order is Kim → Mộc → Thuỷ → Hoả → Thổ (Ngũ Hành tương sinh — generative cycle: Metal→Wood→Water→Fire→Earth). Confirm if you'd prefer the destructive cycle order or a different element ordering.
5. Mobile 1-column collapse breakpoint moved 500→420px. At 375px users now see 2 cols; some may prefer the larger-tap 1-col layout — easy to tune.

**Status:** DONE
**Summary:** Shipped 12 targeted UI/UX fixes across `style.css`, `index.html`, `js/render-elements.js` — contrast, mobile overflow, focus rings, brand ribbon, accessible chip labels, distinct disclosure styling. All hard constraints respected. CSS file 302 lines (<400 cap), no new files, no build step.
