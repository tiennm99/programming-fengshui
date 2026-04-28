# TODO — programming-fengshui

Last session ended: 2026-04-27 21:14 (Asia/Saigon). Branch: `main`.

Pick up here next time.

## Context for next session

- Site is single-mode now (classic panel removed); modern grid is the only view, 2018 source image lives under a `<details>` spoiler.
- Three segmented controls live above the grid: **Nguồn màu** (GitHub / GitLab), **Hiển thị** (TIOBE Top 20 / Tất cả ngôn ngữ), **Sắp xếp** (Mặc định / A–Z / Cầu vồng).
- Cards have element-tinted backgrounds, count line picks up element color.
- Most recent UI/UX review and unresolved questions: `plans/reports/ui-ux-260427-2043-fengshui-page-review.md`.

## Open items (in priority order)

### 1. OG / social card image
- `index.html:21` `og:image` still points at the 2018 source image. Replace with a render of the current Ngũ Hành cards.
- Options: screenshot the live page at 1200×630 (need a working browser on this aarch64 host first — last attempt failed because cached puppeteer chrome is x86_64 ELF), or build an HTML→PNG via the `design` skill.
- Output: `assets/og-card.png`, then update the meta tag.

### 2. Resolve the open questions in the UI/UX review
From `plans/reports/ui-ux-260427-2043-fengshui-page-review.md` §7:
1. **5-card-row symbolism** — keep `auto-fit minmax(220px, 1fr)` (current) or force back to 5-col with a wider `--page-width`? The 5-element wheel is part of the joke; auto-fit may collapse to 2–3 cols on common viewports.
2. **Empty KIM bucket in TIOBE view** — KIM has 0 TIOBE Top 20 entries. Should we hide the empty card or keep the heading visible? Current state: heading + "0 ngôn ngữ" count.
3. **Persist user toggle choices** — view + sort + source currently reset on every load. Wire to URL query params (`?source=gitlab&view=all&sort=hue`) for shareable state. Probably P3 — small win, low cost.
4. **GitLab vs GitHub palette disparity tooltip** — GitLab has 91 entries vs GitHub's 664. Add a small note when GitLab is selected so users don't think it's broken.
5. **Strict AA vs decorative chip contrast** — review §2 brought worst cases above AA via the new `pickTextColor`, but a few still hover at 3.5–4.0:1 (Swift, MATLAB). Acceptable for decorative chips? Document the policy.

### 3. Polish leftovers from the review (none of them blocking)
- ARIA radio pattern is in place on the segmented controls — recheck with NVDA / VoiceOver if you have access.
- Anchor link underlines (`.credit a`, `.figure figcaption a`) use `border-bottom: 1px dotted` — at small sizes this can render sub-pixel. Migrate to native `text-decoration: underline; text-decoration-style: dotted;` when convenient.
- `.hero .subtitle` is italic — Be Vietnam Pro italic at small sizes can look slanted-rough on Linux. Consider dropping italic in favour of letter-spacing.
- Per-card "Top 5 non-TIOBE peek" when in TIOBE view — additive feature, see review §6.
- Subtle Lunar-New-Year SVG texture at ~3 % opacity for body bg — ditto §6.

### 4. Tests / verification
- The `classify-element.test.html` harness still passes 22/22 (last verified). Re-run when you make any classifier rule changes.
- No automated browser test for the page itself — if doing meaningful changes, spin up `python3 -m http.server 8765` and walk through each toggle by hand.

## Reference reports (do NOT delete)

- `plans/reports/researcher-260427-0854-nguhanh-color-classifier.md` — algorithm spec, referenced in `js/classify-element.js:1`.
- `plans/reports/researcher-260427-0855-github-language-colors.md` — GitHub Linguist data source rationale.
- `plans/reports/researcher-260427-1024-gitlab-colors-source.md` — GitLab data source.
- `plans/reports/brainstorm-260427-1046-kim-rebalance.md` — explains the current L≥70 "metallic shine" KIM rule.
- `plans/reports/ui-ux-260427-2043-fengshui-page-review.md` — most recent review; top-3 critical fixes shipped, polish items partly shipped (live UX baseline; supersedes the dropped first-pass audit).
