# UI/UX review — Phong-thuỷ ngôn ngữ lập trình

Date: 2026-04-27
Scope: static review of `index.html`, `style.css`, `js/render-elements.js`, `js/main.js`, plus quantitative contrast/layout analysis over `data/github-colors.json` (664 colored entries) and `data/gitlab-colors.json` (91 colored entries).

> **Cleanup note (2026-04-28):** Top-3 critical fixes (§2) and most §3/§4/§5 items shipped in commits `e868002` → `7bcf9b9`. This file kept as evidence backing the still-open §7 questions and the §6 nice-to-haves. Original full report (with code prescriptions) is in git history at commit `7bcf9b9^`.

> **Environment note (not a finding):** Could not capture browser screenshots — the only available browser binary in the puppeteer cache is x86_64 ELF but the host is aarch64 (`/config/.cache/puppeteer/chrome/linux_arm-147.0.7727.57/chrome-linux64/chrome` is mislabeled). `chromium-browser` only via snap, no-auto-install rule applies. Review is source + computed metrics, not pixel screenshots. `visuals/contrast-analysis.txt` has full per-chip pre-fix metrics for reproducibility.

---

## 1. Original verdict (historical)

5-column grid at 880px page width gave each card only ~158 px of inner room; chips with names like "Mathematical Programming System" (221 px wide) overflowed every card. ~39 % of all chips failed WCAG AA contrast (256/664 GitHub, 9 of 19 TIOBE Top 20). "Tất cả ngôn ngữ" segmented control silently did nothing because `js/main.js` queried a deleted `#panel-modern` ancestor. Cards felt anaemic — 4 px top stripe + colored `<h3>` was the only brand-touch.

---

## 2. Top 3 critical issues — SHIPPED

| # | Issue | Where | Status |
|---|-------|-------|--------|
| 1 | 5-col grid too tight; chips overflow cards. Top GitHub name "Mathematical Programming System" 31 chars ≈ 221 px vs card chip area 126 px. KIM 0/MỘC 4/THUỶ 4/HOẢ 4/THỔ 7 (TIOBE) and 65/167/156/201/75 (all-langs). | `style.css:140-145` (`auto-fit minmax(220px, 1fr)`), `style.css:228-237` (chip soft-wrap) | ✅ shipped |
| 2 | 39 % chip text contrast fail; 9 of 19 TIOBE chips below 4.5:1 (Rust 2.14:1 worst with white text on `#dea584`). Old `pickTextColor` used 0.5 luminance threshold. | `js/render-elements.js:13-21` (computes both ratios + picks higher), `style.css:240-242` (text-shadow boost), `style.css:243-246` (TIOBE chip outline) | ✅ shipped |
| 3 | "Tất cả ngôn ngữ" segmented control + legend dead — `init()` queried `#panel-modern .legend` / `#panel-modern .elements` which no longer existed. View-toggle never mounted. | `js/main.js:112-141` (selectors point at `main .elements`, segmented controls mount via `mountSegmentedControl`) | ✅ shipped |

Post-fix worst-case contrast (per the original prescription's projection): Rust → 8.34:1, Go → 6.17:1, Swift → 3.78:1 (borderline but legal). Swift / MATLAB still hover 3.5–4.0:1 — see open question §7.5.

---

## 3. Medium-priority polish — remaining

Most of §3 shipped (mode-tag move, color-mix card tints, hero-ribbon size bump, `.modern-controls align-items: stretch`, `.card-count` weight/size bump, `.chips` gap bump, mobile breakpoints, touch-target). Still open:

- **`style.css:161` — `.card h3 { letter-spacing: 1.2px; }`** plus uppercase Vietnamese glyphs (KIM/MỘC/THUỶ/HOẢ/THỔ) makes diacritics drift. Reduce to `0.4px` or set `text-transform` explicitly.
- **`style.css:161` — h3 size still `1.05rem`.** Hierarchy is flat (h3 1.05rem, count 0.85rem, chip 0.78rem). Bump h3 to `1.2rem` and add a thin gold rule under it for visual weight.
- **`style.css:81` — subtitle `font-style: italic`** in `Be Vietnam Pro` italic looks slanted-rough on Linux; consider dropping italic in favour of `letter-spacing`. (Also tracked in `todo.md §3`.)
- **`style.css:124-127, 187-190` — credit + figcaption links use `border-bottom: 1px dotted`** — at small sizes renders sub-pixel. Migrate to native `text-decoration: underline; text-decoration-style: dotted;`. (Also tracked in `todo.md §3`.)
- **`index.html:83-96` — Credit `<ul>` indent (`margin-left: 1.25rem`) inside centred-h2 panel** looks off. Centre, remove indent, or lay out as a 2-row stack.
- **`style.css:99-109` — original-image summary marker** uses a webkit-only `::-webkit-details-marker` hack. Add a generic `details > summary { list-style: none; }` for Firefox parity.
- **`index.html:61` — Disclaimer paragraph** runs the parenthetical "(palette khác hẳn)" at the end of a long line. Split into two sentences for mobile readability.

---

## 4. A11y — remaining

Skip-link, lang attr, ribbon ARIA, focus-visible rings, reduced-motion all PASS. Tab roles fixed (now `radiogroup` + `radio` per `render-elements.js:66-111`). Touch targets fixed (`style.css:314` `min-height: 44px`). Heading order fixed (`<small>` moved out of `<h2>` to `.mode-tag`). Chip text contrast fixed (Issue 2). Still open:

- **Anchor underline visibility** — dotted 1px `var(--accent)` at small font sizes is sub-pixel rendered, can disappear. WCAG 2.1 SC 1.4.1. Same fix as §3.4 above.
- **Chip vs page-bg shape edge** — pale chips like Rust `#dea584` have ~1.36:1 against page cream. Chip itself nearly disappears. Border `rgba(0,0,0,0.18)` helps slightly; consider stronger shape edge for low-saturation chips.
- **`prefers-color-scheme: dark`** — no dark-mode tokens. Flagged nice-to-have, not blocker.
- **Chip `role="list"` / `role="listitem"`** — current chips are plain `<span>` inside `<div class="chips">`; SR users get plain text announcement. Optional improvement.

---

## 6. Optional nice-to-haves (do not bloat — pick one if you must)

- **Per-card "Top 5 non-TIOBE peek"** when `.show-all` is OFF: dimmed chips showing the 5 most-popular non-TIOBE entries beside the pinned TIOBE ones. Adds context. (Mirrored in `todo.md §3`.)
- **OG image regeneration** — `index.html:22` still points at the 2018 source image; shows old design when shared. (Mirrored in `todo.md §1`.)
- **Element legend per-card** — current `.legend` paragraph is a single italic line below the grid. Consider promoting the per-element rule to a card subtitle ("đỏ/cam/tím đậm" on HOẢ etc.).
- **Subtle Lunar-New-Year texture** — faint cloud-pattern SVG at ~3 % opacity in body bg, tasteful. (Mirrored in `todo.md §3`.)
- **Hover-pin / click-to-pin chip popover** with hex + classification rationale (already in tooltip).

---

## 7. Open questions

1. Is the 5-card-row layout a hard requirement (Ngũ-Hành-as-row symbolism) or is `auto-fit` acceptable? If symbolic, raise page max-width to ≥ 1080 px and accept the wider page.
2. Should TIOBE-only view show the full count next to each card (e.g. KIM `0` is currently empty — visually awkward) or hide empty cards? Current empty KIM card just shows the heading.
3. Should the "Tất cả ngôn ngữ" view persist via URL hash / `localStorage`? Currently resets every load.
4. Is the GitLab source actually loadable? `data/gitlab-colors.json` has 91 entries vs GitHub's 664 — the disparity is huge. Worth a tooltip on the source toggle saying "GitLab Linguist tracks far fewer languages".
5. Confirm: should chip text contrast follow strict AA (4.5:1) or is the current "best-effort with WCAG luminance" considered acceptable for decorative chips? Post-fix worst case is Swift/MATLAB ~3.5–4.0:1.

---

## Files referenced (all absolute)

- `/config/workspace/tiennm99/programming-fengshui/index.html`
- `/config/workspace/tiennm99/programming-fengshui/style.css`
- `/config/workspace/tiennm99/programming-fengshui/js/main.js`
- `/config/workspace/tiennm99/programming-fengshui/js/render-elements.js`
- `/config/workspace/tiennm99/programming-fengshui/js/classify-element.js`
- `/config/workspace/tiennm99/programming-fengshui/js/tiobe-top.js`
- `/config/workspace/tiennm99/programming-fengshui/data/github-colors.json`
- `/config/workspace/tiennm99/programming-fengshui/data/gitlab-colors.json`
- `/config/workspace/tiennm99/programming-fengshui/plans/reports/visuals/ui-ux-260427-2043/contrast-analysis.txt` — full per-chip pre-fix ratio dump

**Status:** DONE_WITH_CONCERNS (post-cleanup snapshot)
**Summary:** Top-3 critical fixes shipped. Remaining items are §3/§4 polish (anchor underlines, h3 hierarchy, italic subtitle, credit list density, Firefox `details` marker, disclaimer split), §6 nice-to-haves (OG image, Top-5 peek, lunar texture), and §7 open product questions (5-col symbolism, empty KIM card, URL persistence, GitLab disparity tooltip, AA contrast policy).
