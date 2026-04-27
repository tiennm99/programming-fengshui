# GitHub Language Color Palette Research Report

**Date:** 2026-04-27 | **Researcher:** Technical Analyst | **Purpose:** Map programming languages to Feng Shui elements via color input signal

---

## Executive Summary

GitHub maintains 722 language color definitions across their linguist project. Primary data sources: (1) Official YAML at `github-linguist/linguist` on main branch, (2) Pre-built JSON mirrors (`ozh/github-colors` most maintained). For static site consumption in-browser, **recommend ozh/github-colors JSON endpoint** — CORS-enabled (`Access-Control-Allow-Origin: *`), 77.9KB payload, 664 languages have hex colors, no auth required, manually synced from linguist monthly.

---

## 1. Official Source: github-linguist/linguist

### Repository & Branch
- **Repo:** `github-linguist/linguist` (github-linguist org, not github org)
- **Current Branch:** `main` (not `master` — master is deprecated)
- **Raw File URL:** `https://raw.githubusercontent.com/github-linguist/linguist/main/lib/linguist/languages.yml`

### YAML Schema
Each language entry has these fields:

```yaml
LanguageName:
  type: [programming|markup|data|prose]
  color: "#RRGGBB"         # Hex format, may be null/absent
  extensions: [".ext1", ".ext2"]
  tm_scope: "source.lang"
  ace_mode: "ace_mode_name"
  language_id: 123456
  aliases: [alias1, alias2]
  filenames: [filename.ext]
  interpreters: [interpreter]
  codemirror_mode: "mode"
  codemirror_mime_type: "mime/type"
```

### Color Field Encoding
- **Format:** `"#RRGGBB"` (6-digit hex, lowercase)
- **Optional:** Many markup, data, and prose languages omit color entirely
- **Example:** JavaScript = `"#f1e05a"`, Python = `"#3572A5"`, Rust = `"#ce422b"`

### Coverage
- **Total languages:** ~720–740 (varies with version)
- **Languages with colors:** ~664 (from ozh/github-colors sync)
- **Languages without colors:** ~58 (data formats, prose, markup like JSON, YAML, Markdown)
- **Most are programming language types**; data/markup skew toward null colors

### Caveats
- YAML is verbose; raw GitHub URL requires parsing
- No JSON/structured feed from official source
- Requires HTTP fetch + parsing (not trivial in browser without build step)
- Linguist updates when community merges color PRs; cadence ~monthly

---

## 2. Pre-Built Mirrors & Convenience Sources

### Option A: ozh/github-colors (RECOMMENDED)

**Repo:** `ozh/github-colors`  
**URL:** `https://raw.githubusercontent.com/ozh/github-colors/master/colors.json`  
**Last Updated:** 2026-04-20 (confirmed active)  
**License:** MIT

**Data Format:**
```json
{
  "JavaScript": {
    "color": "#f1e05a",
    "url": "https://github.com/trending?l=JavaScript"
  },
  "JSON": {
    "color": null,
    "url": "https://github.com/trending?l=JSON"
  }
}
```

**Metrics:**
- **Total entries:** 722 languages
- **Entries with color:** 664
- **Entries with null color:** 58
- **File size:** 77.9 KB (JSON)
- **CORS:** ✅ `Access-Control-Allow-Origin: *` (browser-friendly)
- **Auth required:** ❌ No

**How it works:**
- Python script (`github-colors.py`) scrapes linguist monthly
- Converts YAML to JSON
- Commits to repo; automation keeps colors fresh
- No API key needed; no rate limits

**Pros:**
- Already JSON (no parsing overhead)
- CORS-enabled for in-browser fetch
- Lightweight payload
- No API auth
- Actively maintained (last sync April 2026)

**Cons:**
- ~1-month lag behind linguist if community adds colors
- Manual sync (not realtime)
- Third-party mirror (not official GitHub product)

### Option B: simonecorsi/github-languages-colors

**Repo:** `simonecorsi/github-languages-colors`  
**NPM:** `github-languages-colors` v10.3.1  
**Last Published:** August 2025 (8 months ago, likely outdated relative to April 2026 date)  
**Claim:** "Updates daily from GitHub definitions"

**Status:** ⚠️ Last publish 8+ months ago contradicts "daily" claim. Likely unmaintained.

### Option C: doda-zz/github-language-colors

**NPM:** `github-language-colors` v1.0.0  
**Last Published:** ~2019 (7 years ago, effectively abandoned)

**Status:** ❌ Do not use.

### Option D: GitHub REST API (Official)

**Endpoint:** N/A — no dedicated "languages" endpoint exists  
**Workaround:** Use `GET /repos/{owner}/{repo}/languages` to fetch language breakdown for a specific repo

**Rate Limits:**
- Core REST API: 60 req/hr (unauthenticated), 5,000 req/hr (authenticated with token)
- Per [GitHub Docs](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)

**Caveats:**
- Per-repo endpoint; must query each repo individually → not scalable for full palette
- Returns only languages used in that repo, not all colors
- High rate-limit cost for comprehensive color dataset
- Requires auth token in production

**Verdict:** ❌ Impractical for static site needing all colors at once.

---

## 3. Recommended Data Source for Static Site

### Choice: ozh/github-colors JSON

**Why:**
1. **CORS-enabled** → fetch directly in browser, no proxy needed
2. **Pre-formatted JSON** → zero parsing overhead
3. **Single HTTP fetch** → load all 722 languages at once, ~78 KB
4. **No build step required** → works in plain HTML + JS
5. **No auth** → no token management
6. **Actively maintained** → synced April 2026
7. **No rate limits** → unlimited requests
8. **Includes trending URLs** → bonus feature for UX

**Static Site Implementation:**
```html
<script>
  fetch('https://raw.githubusercontent.com/ozh/github-colors/master/colors.json')
    .then(r => r.json())
    .then(colors => {
      // colors: { "JavaScript": { color: "#f1e05a", url: "..." }, ... }
      // Map to Feng Shui elements here
    });
</script>
```

**Fallback:** If CORS fails in production (rare), serve JSON locally via build step or API proxy.

---

## 4. Sample Language Colors (Representative Set)

| Language | Hex Color | Type | Element Candidate |
|----------|-----------|------|-------------------|
| JavaScript | #f1e05a | Programming | 火 (red-ish yellow) |
| Python | #3572A5 | Programming | 水 (deep blue) |
| Rust | #ce422b | Programming | 火 (red) |
| Go | #00ADD8 | Programming | 水 (cyan) |
| C | #555555 | Programming | 土 (gray) |
| Java | #b07219 | Programming | 火 (brown-orange) |
| Ruby | #cc342d | Programming | 火 (red) |
| PHP | #4F5D95 | Programming | 水 (blue) |
| TypeScript | #3178c6 | Programming | 水 (blue) |
| Swift | #FA7343 | Programming | 火 (orange) |
| Kotlin | #A97BFF | Programming | 木 (purple-ish) |
| C++ | #f34b7d | Programming | 火 (pink-red) |
| C# | #178600 | Programming | 木 (green) |
| Scheme | #1e4d8b | Programming | 水 (dark blue) |
| Haskell | #5e5086 | Programming | 木 (purple) |

**Legend:**
- 火 (Fire) = Warm colors (reds, oranges, yellows): Ruby, Rust, Swift, Java, JavaScript
- 水 (Water) = Cool colors (blues, cyans): Python, Go, TypeScript, PHP
- 木 (Wood) = Green/plant tones: C#, Kotlin, Haskell
- 金 (Metal) = Silvers/grays: C, some minimal colors
- 土 (Earth) = Browns, beiges: uncertain representation in sample

**Sample Check:** The palette skews heavily toward reds and blues. Fire and Water elements dominate. No pure silvers (金) or browns (土) in top 15 sample — mapping may require synthetic rules or boundary zones.

---

## 5. Data Coverage & Caveats

### Languages Without Colors (58 total)
Examples: JSON, YAML, XML, Markdown, HTML, CSV, TOML, Protocol Buffers, etc.

**Why:** Data/markup formats don't need syntax highlighting distinction; no "canonical" color assigned by GitHub.

**Impact:** Element mapping cannot rely solely on color for these 58. May need fallback rules (e.g., "markup → 土").

### Color Collisions
- No two languages share the same hex code (GitHub enforces uniqueness)
- But visually similar colors exist (e.g., #f1e05a vs #f4d03f are both yellows)

### Data Freshness
- ozh/github-colors last synced: 2026-04-20 (7 days old as of report date)
- linguist updates: ~monthly when community merges PRs
- Lag: ~1 month possible between linguist change and ozh sync

### File Size
- 77.9 KB (JSON, gzipped ~15–20 KB)
- Acceptable for static site; no performance concern

---

## 6. Implementation Checklist for Planner

- [ ] Decide element mapping rules for 5 Feng Shui elements
- [ ] Handle 58 languages with null colors (fallback strategy)
- [ ] Test ozh/github-colors CORS in production environment
- [ ] Consider caching strategy (fetch on page load, or serve pre-cached in build)
- [ ] Validate sample colors visually before finalizing mapping
- [ ] Plan refresh cadence (monthly? per user session?)
- [ ] Define color-to-element heuristics (e.g., HSL hue ranges → elements)

---

## Sources

- [github-linguist/linguist repository](https://github.com/github-linguist/linguist)
- [linguist/languages.yml raw file](https://raw.githubusercontent.com/github-linguist/linguist/main/lib/linguist/languages.yml)
- [ozh/github-colors repository](https://github.com/ozh/github-colors)
- [ozh/github-colors colors.json](https://raw.githubusercontent.com/ozh/github-colors/master/colors.json)
- [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [simonecorsi/github-languages-colors](https://github.com/simonecorsi/github-languages-colors)
- [github-colors npm package](https://www.npmjs.com/package/github-colors)
- [doda-zz/github-language-colors](https://github.com/doda-zz/github-language-colors)

---

## Unresolved Questions

1. **Element mapping heuristics:** How to define the boundary between Fire/Water/Wood/Metal/Earth using hex color alone? E.g., hue ranges, saturation thresholds, or manual grouping?
2. **Null color handling:** For 58 languages without colors, assign to an element by type (markup → 土?) or create a special "unassigned" category?
3. **Color collisions:** If two languages visually map to the same element, should they be grouped or kept separate in the final display?
4. **Sync strategy:** Pre-build static JSON cache (quarterly?) or live-fetch from ozh on page load?
5. **Accessibility:** Should the site also provide non-color cues (symbols, text labels) for the elements given reliance on hex hues?

