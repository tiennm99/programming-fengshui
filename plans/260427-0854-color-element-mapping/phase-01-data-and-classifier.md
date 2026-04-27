---
title: "Phase 01 — Vendor color data + HSL classifier module"
status: pending
priority: P2
effort: 60m
---

## Context Links

- Plan overview: [plan.md](plan.md)
- Color data report: [../reports/researcher-260427-0855-github-language-colors.md](../reports/researcher-260427-0855-github-language-colors.md)
- Classifier algorithm report: [../reports/researcher-260427-0854-nguhanh-color-classifier.md](../reports/researcher-260427-0854-nguhanh-color-classifier.md)
- Existing files: `index.html`, `style.css`

## Overview

- **Priority:** P2 (foundation for phases 02–04)
- **Status:** pending
- **Description:** Vendor `ozh/github-colors` JSON locally and implement a pure-function HSL classifier (`hex → element`) with an in-browser sanity-check harness.

## Key Insights

- Report #1 confirms `ozh/github-colors` JSON is CORS-friendly + 78KB, but vendoring locally avoids any runtime third-party dependency and keeps the page working offline / on `file://`.
- Report #2 provides a deterministic HSL algorithm with explicit Step-2 grayscale handling and Step-4 edge-case refinements. Translate Python pseudocode to JS literally — do not invent variations.
- Report #2 §3 lists 12 sample languages with expected outputs; report §4 lists 10 canonical edge colors. These are the test fixtures.
- Element keys must be lowercase (`kim`, `moc`, `thuy`, `hoa`, `tho`) so they match the existing CSS class names in `style.css` (lines 124–133). Reports use uppercase Vietnamese — translate at module boundary.

## Requirements

### Functional
- Vendor `data/github-colors.json` (~78KB) at the documented schema: `{ "<Language>": { "color": "#hex"|null, "url": "..." } }`.
- Provide ES module `js/classify-element.js` exporting:
  - `hexToHsl(hex: string): { h: number, s: number, l: number }` — H ∈ [0, 360), S/L ∈ [0, 100]
  - `classify(hex: string): 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho'` — implements report §2 Steps 2–4 verbatim
  - `ELEMENTS` constant: ordered list `['kim', 'moc', 'thuy', 'hoa', 'tho']` with display labels (`KIM`, `MỘC`, `THUỶ`, `HOẢ`, `THỔ`)
- Provide `js/classify-element.test.html` — opens in any browser, runs assertions, prints green PASS / red FAIL list. No test framework. No build.

### Non-functional
- File size budget: `classify-element.js` ≤ 120 lines, `classify-element.test.html` ≤ 100 lines (project rule: <200 lines/file).
- Pure functions: no I/O, no DOM, no globals. Importable from Node for future tooling without changes.
- Hex input tolerated: `#RRGGBB` and `#rrggbb`. Throw on malformed input (don't silently mis-classify).

## Architecture

### Data flow
```
data/github-colors.json (static)
        │
        ▼ (fetched in Phase 02)
{ "JavaScript": { color: "#f1e05a", url: "..." }, ... }
        │
        ▼ (Phase 02 calls classify(entry.color))
classify-element.js  ──▶  'thy' | 'kim' | ...
```

In Phase 01, the classifier is exercised only by the test harness — no integration yet.

### Module contract (`js/classify-element.js`)

```js
// Input: '#RRGGBB' or '#rrggbb'
// Output: 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho'
// Throws: TypeError if input is null/undefined/not a 7-char hex string.
export function classify(hex) { ... }

export function hexToHsl(hex) { ... } // exported for test visibility

export const ELEMENTS = [
  { key: 'kim',  label: 'KIM'  },
  { key: 'moc',  label: 'MỘC'  },
  { key: 'thuy', label: 'THUỶ' },
  { key: 'hoa',  label: 'HOẢ'  },
  { key: 'tho',  label: 'THỔ'  },
];
```

### Classifier rules (mirror report #2 §2)

1. Parse `#RRGGBB` → R, G, B ∈ [0, 255] → normalize → HSL.
2. Grayscale (`S < 5`):
   - `L < 20` → `thuy`
   - `20 ≤ L < 70` → `tho`
   - `L ≥ 70` → `kim`
3. Hue ranges:
   - `[0, 20)` → `hoa`
   - `[20, 40)` → `hoa` if `S ≥ 60 && L ≥ 50` else `tho`
   - `[40, 70)` → `tho`
   - `[70, 200)` → `moc` (covers green + jade/cyan)
   - `[200, 260)` → `thuy`
   - `[260, 360)` → `hoa`

## Related Code Files

### Create
- `data/github-colors.json` (vendored, ~78KB)
- `js/classify-element.js`
- `js/classify-element.test.html`

### Modify
- None.

### Delete
- None.

## Implementation Steps

1. Fetch the JSON once: `curl -fsSL https://raw.githubusercontent.com/ozh/github-colors/master/colors.json -o data/github-colors.json`. Verify file is well-formed JSON (`python3 -m json.tool data/github-colors.json | head` is fine for a smoke check).
2. Create `js/classify-element.js`:
   - Implement `hexToHsl(hex)` — port report #2 pseudocode line by line. Handle `max == min` achromatic case (S=0, H=0).
   - Implement `classify(hex)` — call `hexToHsl`, then run Step 2 then Step 3, return lowercase string.
   - Export `ELEMENTS` array.
   - Add a leading file comment citing the algorithm source: `// Algorithm: plans/reports/researcher-260427-0854-nguhanh-color-classifier.md §2`.
3. Create `js/classify-element.test.html`:
   - Plain HTML with `<script type="module">` importing `./classify-element.js`.
   - Define a `cases` array with the 12 samples from report §3 + 10 edge colors from report §4.
   - Loop, compare actual vs expected, append `<li>` to a `<ul>` with PASS (green) / FAIL (red).
   - Display total counts at the bottom.
4. Open `js/classify-element.test.html` in a browser; confirm all 22 cases PASS. If any fail, fix algorithm — do NOT edit expected values.

## Todo List

- [ ] Download and vendor `data/github-colors.json`
- [ ] Implement `hexToHsl(hex)` in `js/classify-element.js`
- [ ] Implement `classify(hex)` with Step 2 + Step 3 rules
- [ ] Export `ELEMENTS` constant with `key` + `label`
- [ ] Build `js/classify-element.test.html` harness
- [ ] Add 12 sample-language cases (report §3)
- [ ] Add 10 edge-case cases (report §4)
- [ ] Run harness in browser; confirm 22/22 PASS

## Success Criteria

- `data/github-colors.json` exists, parses, contains ≥600 entries with non-null colors.
- `node --input-type=module -e "import {classify} from './js/classify-element.js'; console.log(classify('#f1e05a'))"` prints `tho`.
- Opening `js/classify-element.test.html` in a browser shows all 22 PASS lines, zero FAIL.
- Running `wc -l js/classify-element.js` returns ≤ 120.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| RGB→HSL math bug (off-by-one on hue) | Med | High (mis-classifies many languages) | Test harness with 22 cases catches it; mirror pseudocode literally |
| JSON download is rate-limited or moved | Low | Med | Try once; fall back to manually downloading via browser. URL is documented in report #1. |
| Vendored JSON gets stale | Med | Low | This is a joke site; staleness is acceptable. Document refresh command in `data/README.md` (one-liner) — defer if YAGNI |
| Edge case Swift `#ffac45` (report flagged as borderline) | Low | Low | Report §3 resolves it: classifies as HOẢ via current rules. Test case enforces this. |

## Security Considerations

- No secrets, no auth, no user input — pure data + pure function.
- JSON is third-party data; treat as untrusted: validate that color values match `/^#[0-9a-fA-F]{6}$/` before classifying. Skip on mismatch.

## Next Steps

- Phase 02 imports `classify` and `ELEMENTS` to render the grid. Do not wire up rendering here.
- If the test harness fails on a case, fix the classifier — do not change the expected value without updating report #2 first.
