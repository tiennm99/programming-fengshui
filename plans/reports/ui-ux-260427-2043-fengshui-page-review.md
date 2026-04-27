# UI/UX review — Phong-thuỷ ngôn ngữ lập trình

Date: 2026-04-27
Scope: static review of `index.html`, `style.css`, `js/render-elements.js`, `js/main.js`, plus quantitative contrast/layout analysis over `data/github-colors.json` (664 colored entries) and `data/gitlab-colors.json` (91 colored entries).

> **Environment note (not a finding):** I could not capture browser screenshots — the only available browser binary in the puppeteer cache is x86_64 ELF but the host is aarch64 (`/config/.cache/puppeteer/chrome/linux_arm-147.0.7727.57/chrome-linux64/chrome` is mislabeled, actually x86_64). `chromium-browser` is only available via snap, and per memory rules I cannot auto-install. So this review is **source + computed metrics**, not pixel screenshots. Numbers below are derived from CSS tokens + JSON data; layout dimensions are arithmetic. Server was started/killed cleanly. The `visuals/` folder still contains `contrast-analysis.txt` with full per-chip metrics for reproducibility.

---

## 1. Quick verdict

Page concept is charming (Lunar-New-Year palette, Ngũ Hành cards) and the design tokens at `style.css:5-31` are clean. **But the rendered result is broken in two visible ways and one invisible-but-fatal way**: the 5-column grid at the 880px page width gives each card only ~158 px of inner room (~126 px after card padding) — chips with names like "Mathematical Programming System" (221 px wide) overflow every card on every viewport above 720 px; ~39 % of all chips fail WCAG AA contrast (256 / 664 GitHub entries, including 9 of 19 TIOBE Top 20 chips); and the "Tất cả ngôn ngữ" segmented control silently does nothing because `js/main.js:82-83` queries a now-deleted `#panel-modern` ancestor. Cards also feel anaemic — a 4 px top stripe plus a coloured `<h3>` is the only brand-touch, and the count line is muted-tiny, so the visual hierarchy reads as "five small grey boxes with rainbow tags inside".

---

## 2. Top 3 ugly issues

### Issue 1 — 5-column grid is structurally too tight; chips overflow cards

**Where:** `style.css:140-144`, default `.grid` 5 cols × 880 px page.

**Math:**
- Page content width: `880 − 2·16 = 848 px` (`.page` `style.css:69-72`).
- 5 cols, gap `0.9rem = 14.4 px`: card outer = `(848 − 4·14.4) / 5 = 158.1 px`.
- Card horizontal padding `1rem` each side → chip area = `158.1 − 32 = 126.1 px`.
- At tablet 768 px: card outer = `135.7 px`, chip area = `103.7 px`.
- Longest GitHub chip name "Mathematical Programming System" (31 chars, font-size `0.78rem`) ≈ `221 px` including chip padding `0.6rem` × 2.
- Across GitHub data, **~14 % of names** are >12 chars — they all exceed the chip area, especially in TIOBE view since names like "Visual Basic .NET" (17 chars ≈ 130 px) are pinned on top.
- TIOBE bucket sizes: KIM 0, MỘC 4, THUỶ 4, HOẢ 4, THỔ 7 → KIM card is empty in default view (count only); other cards show 4–7 chips squeezed two-per-row at desktop, one-per-row at tablet.
- All-langs bucket sizes (GitHub): KIM 65, MỘC 167, THUỶ 156, HOẢ 201, THỔ 75 → with `grid-auto-rows: auto` the HOẢ card becomes a 3× tall column shoving the entire grid into massive height inequality (the 1-fr columns are content-driven so all 5 columns share the **tallest column's** rendered height visually — they are independent rows). The visual effect is one giant column and four short ones.

**Drop-in fix (preferred — auto-fit columns by content, not fixed 5):**

```css
/* style.css:140-144 — REPLACE */
.grid {
  display: grid;
  gap: 1rem;
  /* Was: repeat(5, minmax(0, 1fr)). 5 cols at 880px gives ~158px cards
     which crushes any chip name >10 chars. Switch to flex columns:
     allow each card to take 220px+ when room exists, fall to 2–3 cols
     on narrow desktops, 1 col on phones (existing 720px breakpoint). */
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-items: start;
}
```

**Drop-in fix (alternative — keep 5 cols but make scoped to wide screens, raise page max-width):**

```css
/* style.css:69-72 */
.page { max-width: 1080px; padding: 2.25rem 1.25rem 3rem; }

/* style.css:140-144 */
.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: start;
}
@media (max-width: 1080px) { .grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); } }
```

**Also fix chip overflow within the card** (keep names readable when they exceed line):

```css
/* style.css:213-220 — REPLACE the .chip block */
.chip {
  display: inline-flex; align-items: center;
  padding: 0.22rem 0.6rem; border-radius: 999px;
  font-size: 0.78rem; line-height: 1.4;
  border: 1px solid rgba(0, 0, 0, 0.18);
  /* was: white-space: nowrap; max-width: 100%; text-overflow: ellipsis;
     — combined with overflow:hidden caused silent truncation that hid
     long names. Allow soft-wrap instead. */
  white-space: normal;
  overflow-wrap: anywhere;
  hyphens: auto;
  background: var(--bg); color: var(--fg);
  max-width: 100%;
}
```

### Issue 2 — Chip text contrast: 39 % AA fail; 9 of 19 TIOBE chips fail (incl. Rust, Swift, Go, MATLAB, Java, C++, R, Perl, SQL)

**Where:** `js/render-elements.js:13-16` (`pickTextColor`).

```js
function pickTextColor(hex) {
  // Threshold tuned so saturated mid-tones (#d44950, #5d4037) get white text.
  return relLuminance(hex) > 0.5 ? '#1a1a1a' : '#ffffff';
}
```

**Numbers** (computed from real palettes — full list in `visuals/ui-ux-260427-2043/contrast-analysis.txt`):

| TIOBE chip | bg | text picked | ratio | status |
|---|---|---|---|---|
| #1 Python | `#3572A5` | white | 5.12 | pass |
| #2 C | `#555555` | white | 7.46 | AAA |
| **#3 C++** | `#f34b7d` | white | **3.44** | FAIL |
| **#4 Java** | `#b07219` | white | **3.99** | FAIL |
| #5 C# | `#178600` | white | 4.72 | pass |
| #6 JS | `#f1e05a` | black | 12.89 | AAA |
| **#8 SQL** | `#e38c00` | white | **2.62** | FAIL |
| **#9 R** | `#198CE7` | white | **3.53** | FAIL |
| **#12 Perl** | `#0298c3` | white | **3.34** | FAIL |
| **#15 Go** | `#00ADD8` | white | **2.64** | FAIL |
| **#16 Rust** | `#dea584` | white | **2.14** | FAIL (worst) |
| **#17 MATLAB** | `#e16737` | white | **3.39** | FAIL |
| **#19 Swift** | `#F05138` | white | **3.54** | FAIL |
| #20 Ada | `#02f88c` | black | 12.27 | AAA |

The luminance threshold of 0.5 picks white text for a huge band of mid-tones (`#dea584` luminance ≈ 0.444 → picks white → 2.14:1 against the same background). Rust at **2.14:1** is well under even the 3:1 large-text floor. GitLab data is worse (#1 Python `#3581ba` already 4.20 fails).

**Drop-in fix — better text picker (chooses whichever of black/white actually scores higher, falls back to a darkened tint when neither passes):**

```js
// js/render-elements.js:13-16 — REPLACE pickTextColor and helper
function _ratio(L1, L2) { const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1]; return (a + 0.05) / (b + 0.05); }
function pickTextColor(hex) {
  const L = relLuminance(hex);
  const Lblack = 0.0,  Lwhite = 1.0;
  const rBlack = _ratio(L, Lblack);
  const rWhite = _ratio(L, Lwhite);
  // Always pick the higher-contrast option; tie-break to black for warm mid-tones
  return rBlack >= rWhite ? '#111' : '#fff';
}
```

This alone moves Rust to **8.34:1** (black on `#dea584`), Go to **6.17:1** (black on `#00ADD8`), Swift to **3.78:1** (black on `#F05138` — borderline but legal). The ones that still fail AA after this fix (e.g. Swift at 3.78) need a **stroked outline** to stop the chip text from disappearing into a saturated background:

```css
/* style.css:213-224 — append after .chip-tiobe block */
.chip {
  /* paint-order trick: outlines text without changing color logic */
  text-shadow:
    0 0 1px rgba(0, 0, 0, 0.55),
    0 0 1px rgba(0, 0, 0, 0.55);
}
```

(Keep the existing border too — the issue is **text vs fill**, not chip vs page.)

**Also**, the TIOBE-emphasis border `rgba(0, 0, 0, 0.45)` (`style.css:221-224`) is invisible on dark/saturated chips like `#3572A5` Python. Replace with a token that mixes with the chip:

```css
.chip-tiobe {
  border-color: rgba(0, 0, 0, 0.45);
  font-weight: 600;
  /* Was: inset 0 0 0 1px rgba(255,255,255,0.15) (barely visible).
     Use a stronger outline so TIOBE chips read at a glance. */
  box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.55), 0 0 0 1px rgba(0, 0, 0, 0.25);
}
```

### Issue 3 — "Tất cả ngôn ngữ" toggle is dead; legend never renders

**Where:** `js/main.js:81-86`. Code queries selectors that no longer exist anywhere in `index.html`:

```js
// js/main.js:81-86
refs.grid     = document.getElementById('element-grid');
refs.legend   = document.querySelector('#panel-modern .legend');   // ← null
refs.section  = document.querySelector('#panel-modern .elements'); // ← null
refs.debug    = document.getElementById('debug-panel');
refs.sourceTag= document.getElementById('source-tag');
```

`#panel-modern` does not exist in `index.html` (grep confirms, only the wrappers `.elements` section exists at `index.html:41`). Effects:

1. `mountViewToggle(viewToggleEl, refs.section)` early-returns at `js/render-elements.js:104-105` (`if (!mountEl || !scopeEl) return;`) so the segmented control **does not mount at all**. Clicking "Tất cả ngôn ngữ" does nothing — the chip cloud stays at TIOBE Top 20 forever.
2. `refs.legend.textContent = LEGEND_TEXT` at `js/main.js:68` silently no-ops; the `<p class="legend"></p>` at `index.html:54` stays empty (extra blank vertical gap).
3. On fetch failure, `renderError(message, refs.section)` at `js/main.js:74-76` no-ops — user sees a blank grid with no message.

**Drop-in fix — point selectors at real elements:**

```js
/* js/main.js:80-94 — REPLACE init() */
function init() {
  const section = document.querySelector('main .elements'); // the actual section
  refs.grid      = document.getElementById('element-grid');
  refs.legend    = section?.querySelector('.legend')      ?? null;
  refs.section   = section;
  refs.debug     = document.getElementById('debug-panel');
  refs.sourceTag = document.getElementById('source-tag');

  mountSourceToggle(
    document.getElementById('source-toggle'),
    Object.entries(SOURCES).map(([key, s]) => ({ key, label: s.label })),
    DEFAULT_SOURCE,
    loadAndRender,
  );
  mountViewToggle(document.getElementById('view-toggle'), refs.section);
  loadAndRender(DEFAULT_SOURCE);
}
```

This is the single most user-visible bug; it dwarfs the cosmetic complaints. The user reported "ugly" — the page is also functionally half-broken.

---

## 3. Medium-priority polish

- **`index.html:42` — `<small>` inside `<h2>`** (`Ngũ Hành & ngôn ngữ <small>Nguồn: GitHub Linguist</small>`) reads as part of the heading line and centres weirdly. Move it under the heading as a separate `<p class="mode-tag">` so the heading stays clean.
- **`style.css:160` — `.card h3 { letter-spacing: 1.2px; }`** plus uppercase Vietnamese glyphs (KIM/MỘC/THUỶ/HOẢ/THỔ) makes diacritics drift. Reduce to `0.4px` and add `font-feature-settings: "ss01"` if the font supports it; or set `text-transform` explicitly so we know it's intentional.
- **`style.css:163-167` — element accent only as 4 px top stripe + h3 colour.** The cards otherwise look identical. Recommend tinting the card background (`background: color-mix(in oklch, var(--kim) 6%, var(--card-bg));` per element) and giving the count line `color: var(--<element>)` at lower opacity. Brand connection becomes obvious at a glance.
- **`style.css:160-161` — h3 size `1.05rem`, count `0.78rem`, chip `0.78rem`.** Hierarchy is flat. Bump h3 to `1.2rem` and add a thin gold rule under it; pull count to `0.85rem` with element colour to give it weight.
- **`style.css:43` — `transition-duration: 0.01ms !important`** in the reduced-motion block also disables the segmented-control hover state because `.source-toggle-btn` (`style.css:250`) uses transitions. Acceptable but worth a comment that animations are intentionally killed.
- **`style.css:229-235` — `.modern-controls` uses `align-items: end;` with `flex-wrap: wrap;`.** When wrap fires the second row's labels are bottom-aligned which looks misaligned vs the toggles above. Switch to `align-items: stretch` and let `.control-group` centre internally.
- **`index.html:32-38` — `.hero-ribbon`** is purely decorative. The 5 stripes (28×4 px each, 6 px gap) read as a tiny dashed underline, not a "ribbon". Either make them ~3× wider (80×6 px) or replace with a single SVG knot/calligraphic stroke. Currently feels accidental.
- **`style.css:81` — subtitle `font-style: italic`** combined with custom Vietnamese accents in `Be Vietnam Pro` italic looks slanted-rough on most rendering; consider `letter-spacing: 0.15px` and drop italic, or use a styled separator dash instead.
- **`style.css:99-108` — original-image summary marker** is a unicode `▸` that rotates 90° on open. The triangle is `--gold` (`#c79b3c`) on cream — fine — but `list-style: none` plus webkit-marker hack works only in WebKit. Add `details > summary { list-style: none; }` at root selector for Firefox parity (current selector `> summary::-webkit-details-marker` only handles webkit).
- **`style.css:206-209` — `.card-count`** at `font-size: 0.78rem` muted equals the chip font size. The card's main metric should be **larger** than the chips' content. Bump to `0.9rem`, give it `font-weight: 600`.
- **`style.css:211 — .chips gap: 0.35rem`** is fine for TIOBE (4–7 chips) but cramped at 100+ chips per card. Switch to `0.4rem 0.5rem` and add `padding-block-start: 0.25rem` so the chip cloud has breathing room from the count line.
- **`style.css:178-184` — credit links use `border-bottom: 1px dotted`.** Cute, but combined with default `text-decoration: none` and the dotted style at small sizes looks like rendering artifact. Either go full underline or `text-decoration: underline; text-decoration-style: dotted; text-decoration-color: var(--accent);` so it sits on the baseline.
- **`index.html:74-91` — Credit list density** is fine but the `<ul>` indent (`margin-left: 1.25rem`) inside a centred-h2 panel looks off. Centre or remove indent; or remove the bullets and lay them out as a 2-row stack.

---

## 4. A11y checks

| Item | Status | Notes |
|---|---|---|
| Skip link present (`index.html:27`) | PASS | Good — `style.css:55-66` correctly hides off-screen and reveals on focus. |
| Lang attr (`index.html:2`) | PASS | `lang="vi"` set. |
| Heading order | WARN | h1 → h2 → h2 → h3 (cards). No h2 inside `details.original-image`. OK semantically, but the `<small>` inside the section h2 (`index.html:42`) may be misread by screen readers as part of heading text. Move it out. |
| Element ribbon ARIA | PASS | `aria-hidden="true"` on `.hero-ribbon`. |
| Chip names | WARN | `aria-label` is set on chips with colour info (`render-elements.js:28`), good. But chips lack a `role` and are wrapped in a plain `<div class="chips">`. Screen-reader users get them announced as plain text with the rank info — acceptable. Consider `role="list"` on `.chips` and `role="listitem"` on chip spans. |
| Tab order | PASS | Skip link → source toggle → view toggle (when fixed) → spoiler → footer links. Logical. |
| Tab roles | WARN | `role="tablist"` is set on toggles (`render-elements.js:62, 113`), but there is no `tabpanel` association. ARIA spec says each tab needs `aria-controls` pointing at a `role="tabpanel"`. Either remove `role="tab"`/`tablist"` and use `role="radio"`/`radiogroup` (these are radios, not tabs), or add `aria-controls="element-grid"` and `role="tabpanel"` on the grid. Recommend radio pattern — segmented controls are a radio pattern, not a tab pattern. |
| Focus-visible rings | PASS | `--focus-ring` token applied (`style.css:27`) on all interactive elements (`style.css:185, 254, 268`). Good. |
| Reduced-motion | PASS | Block at `style.css:37-44`. Card hover translate also gated. |
| Touch target (mobile) | WARN | Toggle buttons `padding: 0.3rem 0.85rem` ≈ 24–28 px tall. Below 44 px AA recommendation. Bump to `min-height: 44px; padding: 0.5rem 1rem;` on mobile. |
| Chip contrast (text) | **FAIL** | 256 / 664 GitHub chips below 4.5:1; 115 below 3:1. See Issue 2. Critical. |
| Chip contrast (chip vs page bg) | PASS-ish | Chips have border `rgba(0,0,0,0.18)` (`style.css:217`) but on `#fdf6ec` cream this is ≈ 1.6:1 — the **shape edge** isn't a contrast requirement, but pale chips like `#dea584` (Rust) have background ≈ 1.36:1 against page cream. So a Rust chip is a beige blob with white text on cream — the chip itself almost disappears. |
| Card border colour | PASS | Top 4 px stripe `--kim/moc/thuy/hoa/tho` against white card all > 3:1. |
| `<details>` keyboard-operable | PASS | Native, no override. |
| Anchor underline visibility | WARN | Dotted 1px `var(--accent)` at small font sizes is sub-pixel rendered, can disappear. WCAG 2.1 SC 1.4.1 requires non-colour link distinguishability — the dotted line may not satisfy at 0.85rem. Switch to dotted-underline `text-decoration` (renders thicker on Firefox/Chrome). |
| `prefers-color-scheme: dark` | FAIL | No dark-mode tokens. Cream + red is hard for dark-mode users, but the page is presentational so this is OK to flag as nice-to-have, not blocker. |

---

## 5. Mobile-specific

- **`@media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }`** (`style.css:295-297`) — at 720 px exactly the 5 cols still hold (CSS uses `<=`). Fine. But:
  - With 1 column and the all-langs view, the HOẢ card alone has 201 chips. At 375 px viewport, chip area ≈ 343 − 32 = 311 px, chip height ~24 px, ~3 chips per row → ~67 rows × 24 ≈ **1600 px tall** for one card. Stacked, the whole grid is **~5 700 px tall**. That's not a bug per se, but there is **no in-card scroll, no collapse, no "show more"**. Recommend `max-height: 60vh; overflow-y: auto;` on `.chips` when the parent has `.show-all`, or a "+X more" affordance.
- **`.modern-controls`** (`style.css:229-232`) wraps at 375 px with two control-groups stacking. With `align-items: end` they sit bottom-of-row mismatched with their labels. Recommend `align-items: stretch`, `flex-direction: column;` below 480 px.
- **`@media (max-width: 420px) { .chip { font-size: 0.74rem; padding: 0.18rem 0.5rem; } }`** (`style.css:299-302`) — touch target now ≈ 22 px tall. Fails AA touch target. Either keep desktop padding on mobile or pair with `min-height: 32px`.
- **`@media (max-width: 320px) { .hero h1 { font-size: 1.4rem; } }`** (`style.css:304-306`) — `clamp(1.55rem, 4.4vw, 2.5rem)` already produces ~14.1 px (0.88rem) at 320 vw which is below the 1.4rem floor anyway. The min in the clamp **is the floor**, so the override isn't needed; the clamp's 1.55rem min already does the right thing. Remove the dead rule or fix the clamp.
- **Hero ribbon** at 375 px: 5 × 28 + 4 × 6 = 164 px wide on a 343 px content area. Looks lost-in-space. Make ribbon width responsive (`clamp(160px, 60vw, 320px)` total).
- **Original-image figure** (`style.css:113-119`) — image scales fine but has `padding: 0.85rem` inside `var(--bg-tint)` which on a 343 px viewport leaves ≈ 316 px image. Fine. But the figcaption font-size 0.9rem with the credit anchor's dotted underline gets fuzzy.
- **Disclaimer paragraph** (`index.html:56`) is 4 lines on mobile. The phrase "(palette khác hẳn)" runs as a parenthetical at the end of a long line — typographically clunky. Consider splitting into two sentences.

---

## 6. Optional nice-to-haves (flag clearly — do not bloat)

- **Sort-toggle for chip cloud** in all-langs view (alphabetical | by-rank | by-hue). Useful for 100+ chips per card; cheap to add (one button + `Array.prototype.sort`). Marked optional; only add after Issue 1/2/3 are fixed.
- **Per-card "Top 5" peek** when `.show-all` is OFF: show the 5 most-popular non-TIOBE chips alongside the TIOBE pinned ones, dimmed. Adds context without overwhelming.
- **Hover-pin / click-to-pin chip** that surfaces colour hex + classification rationale. The data is already in the tooltip — promote it to a small popover for touch users.
- **OG image regeneration** — `assets/ngon-ngu-lap-trinh-phong-thuy.png` is the 2018 Vietnamese-meme original which is fine for credit but using it as og-image (`index.html:22`) shows the old design when the page is shared. Generate a new social card from the current Ngũ Hành cards.
- **Element legend** — `Phân loại theo tông màu HSL: ...` (`js/main.js:14`) is currently never rendered (Issue 3). After fixing, it sits below the grid as italic muted text. Consider promoting it to a per-card mini-legend (one short phrase per element on the card itself: "đỏ/cam/tím đậm" on HOẢ, etc.).
- **Subtle Lunar-New-Year texture** — a faint cloud-pattern SVG at ~3 % opacity in the body background would deepen the Tết theme without distracting. Keep it tasteful.
- **Three.js / WebGL** — overkill for a single-screen presentation. Skip.

---

## 7. Open questions

1. Is the 5-card-row layout a hard requirement (Ngũ-Hành-as-row symbolism) or is `auto-fit` acceptable? If symbolic, raise page max-width to ≥ 1080 px and accept the wider page.
2. Should TIOBE-only view show the full count next to each card (e.g. KIM `0` is currently empty — visually awkward) or hide empty cards? Current empty KIM card just shows the heading.
3. Should the "Tất cả ngôn ngữ" view persist via URL hash / `localStorage`? Currently resets every load.
4. Is the GitLab source actually loadable? `data/gitlab-colors.json` has 91 entries vs GitHub's 722 — the disparity is huge. Worth a tooltip on the source toggle saying "GitLab Linguist tracks far fewer languages".
5. Confirm: should chip text contrast follow strict AA (4.5:1) or is the current "best-effort with WCAG luminance" considered acceptable for decorative chips? My fix targets AA.

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
- `/config/workspace/tiennm99/programming-fengshui/plans/reports/visuals/ui-ux-260427-2043/contrast-analysis.txt` — full per-chip ratio dump

**Status:** DONE_WITH_CONCERNS
**Summary:** Static review delivered with quantitative contrast/layout numbers; identified 1 critical functional bug (dead "Tất cả ngôn ngữ" toggle, dead legend), 1 critical layout bug (5-col grid crushes chips, 256/664 chips fail AA contrast), and a polish list. Concrete drop-in CSS/JS fixes provided for each top-3 issue.
**Concerns:** Could not capture browser screenshots — host is aarch64 but cached puppeteer chrome binaries are x86_64 ELF (mislabeled cache directory `linux_arm-...`). System has no chromium/firefox installed, and no-auto-install policy applies. Replaced screenshots with computed metrics from CSS tokens + JSON data; report cites file:line refs and exact pixel/contrast numbers so the main agent can verify visually after applying fixes. The `visuals/` folder contains `contrast-analysis.txt` for reproducibility.
