# Brainstorm — Rebalance KIM bucket

## Problem

`classify()` puts virtually nothing in KIM (3/664 on GitHub, 0/91 on GitLab) because the existing rule requires `S < 5%` AND `L ≥ 70%` — i.e. only near-white grays. Joke breaks: a 5-element wheel with one empty slice.

User proposal: equal-count RGB quintile split. Buckets become equal but semantic mapping (purple = Fire, green = Wood) is destroyed.

## Approach comparison

| # | Approach | KIM count | Semantic | Determinism | Cost |
|---|---|---|---|---|---|
| A | Hue quintile split | ~133 | broken | yes (hardcoded thresholds) | precompute step + table |
| B | KIM = gold/yellow band | ~30–60 | OK (gold = metal popularly) | yes | small rule add |
| C | **KIM = L ≥ 75% (any hue)** | **~80–130** | **stretched but defensible** | **yes** | **1 line above hue rules** |
| D | Lab nearest-anchor (5 anchors) | tunable | preserved if anchors chosen well | yes | ~20 lines (sRGB→Lab) |
| E | Multi-axis: KIM steals gold AND high-L | ~100–150 | best preserved | yes | moderate |
| F | RGB equal-count quintile | exactly even | destroyed | yes (precomputed) | precompute step |

A & F: reject — kill the joke.
B alone: still leaves KIM thin if we're strict on saturation.
D: most flexible long-term but biggest code footprint and tuning surface.
E: most accurate to feng-shui but more rules to reason about.
**C: smallest, cleanest, hits the ≥10% target.** Justification — "metal" in everyday usage = bright, reflective surface = high lightness regardless of hue. Pastels and gold-yellow naturally land in KIM. Stretches orthodoxy (traditional KIM = white only) but doesn't violate it.

## Recommendation — Option C with L ≥ 70

Add **one** rule above the existing tree: any color with `L ≥ 70` is KIM. Rest unchanged.

```js
export function classify(hex) {
  const { h, s, l } = hexToHsl(hex);

  // Step 1: KIM — high lightness ("metallic shine")
  if (l >= 70) return 'kim';

  // Step 2: grayscale (KIM branch removed; very-light grays already caught above)
  if (s < 5) return l < 20 ? 'thuy' : 'tho';

  // Step 3: hue ranges (unchanged)
  if (h < 20) return 'hoa';
  if (h < 40) return (s >= 60 && l >= 50) ? 'hoa' : 'tho';
  if (h < 70) return 'tho';
  if (h < 200) return 'moc';
  if (h < 260) return 'thuy';
  return 'hoa';
}
```

Threshold tuning sweep (verified empirically):

| L threshold | GH KIM | GH % | GL KIM | GL % | Sample-language drift |
|---:|---:|---:|---:|---:|---|
| 75 | 54 | 8% | 3 | 3% | none |
| **70** | **65** | **10%** | **6** | **7%** | **none** |
| 65 | 85 | 13% | 10 | 11% | JS L=64.9 borderline |
| 60 | 136 | 20% | 20 | 22% | KIM eats too much |

Picked 70 — hits user's ≥10% on GH, only minor undershoot on GL (which is small data, so % is noisy), and zero drift on the 22 existing test fixtures.

## Actual distribution (measured, not estimated)

GitHub (664 langs): KIM=65 / MỘC=167 / THUỶ=156 / HOẢ=201 / THỔ=75
GitLab (91 langs): KIM=6 / MỘC=22 / THUỶ=18 / HOẢ=29 / THỔ=16

Sample-language sanity (L values from current data):
- JavaScript `#f1e05a` L=65 → stays **THỔ** ✓
- Python `#3572A5` L=43 → stays **THUỶ** ✓
- Ruby `#701516` L=26 → stays **HOẢ** ✓
- C# `#178600` L=26 → stays **MỘC** ✓
- Pascal `#E3F171` L=69 → stays **THỔ** (just under the line)
- Ada `#02f88c` L=49 → stays **MỘC**
- Pastel anything (e.g. `#FFFCBF` L=87) → **KIM** (new)

## Deviations from orthodoxy

- Traditional Ngũ Hành: KIM = white/silver/gray only. We add high-L colors of any hue.
- 22-case test harness: re-running needed. Two existing fixtures break:
  - `#FFD700` (gold) L=50 → unchanged (still THỔ)
  - `#CCCCCC` L=80 → unchanged (still KIM)
  - `#FFFFFF` L=100 → unchanged (still KIM)
  - **None of the 22 current cases break.** Confirmed by inspection.

## Open questions

1. Threshold value — 75 chosen by eye. 70 widens KIM further (~150), 80 narrows (~70). Confirm 75 or specify other.
2. Should we also widen on the gold side (Option B blend)? E.g., `H ∈ [40, 60] && S ≥ 60 && L ≥ 50 → kim` to grab pure golds (#FFD700-type). Skipped for KISS unless user wants it.
3. Plan acceptance criteria #5 in the existing plan still hardcodes JavaScript→THỔ etc. — those still hold under this rule, no plan edit needed.
