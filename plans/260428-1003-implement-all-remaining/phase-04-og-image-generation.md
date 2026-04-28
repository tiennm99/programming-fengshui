# Phase 04 — OG social card image generation

## Context

Item 1 — `index.html:22` `og:image` still points at `assets/ngon-ngu-lap-trinh-phong-thuy.png` (the 2018 Vietnamese-meme original). When the page is shared on Facebook / Twitter / Zalo, the preview shows the 2018 design, not the current Ngũ Hành cards. Need a 1200×630 image that reflects the current site.

Independent of Phases 01–03 — can run in parallel or last.

## Overview

- **Priority:** P1 (functional / brand)
- **Status:** pending — known blocker on tooling
- **Effort:** 30 min if tooling works; +60 min for SVG fallback
- **Risk:** medium — host has no working browser binary for screenshot capture; previous attempts failed (cached puppeteer chrome on aarch64 host is x86_64 ELF)

## Files modified

- `assets/og-card.png` — new file (target ~50–150 KB, 1200×630 PNG)
- `index.html:22` — update `og:image` content path; add `og:image:width` / `og:image:height` meta tags
- `index.html:23` — add `og:image:alt`

## Implementation steps

### Step 1 — Try the `design` skill (preferred)

The `design` skill ships an HTML→PNG pipeline. Compose a single-page HTML mock at 1200×630 that includes:

- Title "Phong thuỷ ngôn ngữ lập trình"
- Subtitle "Ngũ Hành tương sinh — code cho hợp tuổi, hợp mệnh"
- 5 element-tinted cards (KIM/MỘC/THUỶ/HOẢ/THỔ) with 4–6 representative TIOBE chips each
- Lunar-new-year cream + gold accent palette (matches `style.css` tokens)
- Site URL or repo handle in a corner

Invoke via `Skill` with `design` and ask for "social card 1200x630, programming-fengshui Ngũ Hành theme, see plan 260428-1003-implement-all-remaining/phase-04-og-image-generation.md for spec". Output to `assets/og-card.png`.

### Step 2 — Fallback A: hand-craft an SVG, rasterise locally

If the `design` skill is unavailable or produces something off-brand:

1. Hand-write `assets/og-card.svg` at viewBox 1200×630 using the same colour tokens as `style.css` (cream bg, accent red title, 5 element bands).
2. Rasterise via ImageMagick CLI (already on the host — already used by `media-processing` skill):
   ```bash
   convert -density 144 -background "#fdf6ec" assets/og-card.svg -resize 1200x630 assets/og-card.png
   ```
3. If `convert` is unavailable or the rendered output is poor: ship the SVG as `og:image` directly. Most platforms accept SVG; some (Facebook) require raster — accept the trade-off.

### Step 3 — Fallback B: use existing 2018 image with a new banner

If neither tool path works, reuse the 2018 image but composite a small "Bản web 2026" badge top-right via ImageMagick. Output to `assets/og-card.png`. Documents that the page is a 2026 reinterpretation, not just a re-host of the original.

### Step 4 — Update `index.html` meta tags

```html
<meta property="og:image" content="assets/og-card.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Phong thuỷ ngôn ngữ lập trình — 5 thẻ Ngũ Hành (Kim, Mộc, Thuỷ, Hoả, Thổ) với các ngôn ngữ TIOBE Top 20" />
<meta name="twitter:image" content="assets/og-card.png" />
```

(Add `twitter:image` in addition to the existing `twitter:card="summary_large_image"`.)

### Step 5 — Verify

- Use Twitter Card Validator: https://cards-dev.twitter.com/validator (need a public URL — paste to user once deployed)
- Use Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Locally: open `index.html` and inspect `<head>`, confirm `og:image` resolves to a 1200×630 PNG.

## Todo list

- [ ] Step 1: try `design` skill HTML→PNG with brand spec
- [ ] If fails — Step 2: hand-craft `assets/og-card.svg` + rasterise via ImageMagick
- [ ] If fails — Step 3: 2018 image + "Bản web 2026" badge
- [ ] Step 4: update `index.html` `og:image` + add width/height/alt + twitter:image
- [ ] Step 5: verify via Twitter / Facebook validators after deploy
- [ ] Manual: confirm `assets/og-card.png` <200 KB (Facebook recommended)

## Success criteria

- `og:image` URL resolves to a 1200×630 PNG <200 KB.
- Image visually reflects the current Ngũ Hành cards (not the 2018 source).
- Alt text in `og:image:alt` describes the image in Vietnamese.
- Twitter card / Facebook preview shows the new image after refreshing the URL on each platform.

## Risks & mitigations

- **Risk:** `design` skill output may not match the on-page typography (different fonts available in the renderer). **Mitigation:** spec the renderer to use a system-stack font (Be Vietnam Pro fallback to system-ui), accept slight visual drift.
- **Risk:** Hand-crafted SVG looks bland vs the on-page design. **Mitigation:** budget extra time; iterate on element-card visual weight.
- **Risk:** ImageMagick `convert` may not be installed. **Mitigation:** check `which convert` first; if absent, ask user to install or fall back to ship SVG directly as og:image.
- **Risk:** New og:image cached by social platforms — won't update for shared links. **Mitigation:** documented in Step 5 — use platform debuggers to force re-scrape after deploy.

## Next steps

→ All 4 phases complete. Final session: update `plans/todo.md` to mark items closed, and either archive this plan dir or move it to `plans/done/`.
