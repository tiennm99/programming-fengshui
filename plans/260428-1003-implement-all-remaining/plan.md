---
title: Implement All Remaining UX/UI Items
slug: 260428-1003-implement-all-remaining
status: in-progress
created: 2026-04-28
blockedBy: []
blocks: []
---

# Implement All Remaining UX/UI Items

Single pass through every remaining item in `plans/todo.md` and the post-cleanup `plans/reports/ui-ux-260427-2043-fengshui-page-review.md`. 15 items, 4 phases.

## Phases

| # | Title | Status | Items |
|---|-------|--------|-------|
| 01 | Style & markup polish | pending | items 5–10, 13, 14, 15 (CSS one-liners + chip role + decision docs) |
| 02 | Functional toggles & tooltip | pending | items 2, 3, 4 (URL persistence, GitLab tooltip, hide empty KIM in TIOBE view) |
| 03 | Additive features | pending | items 11, 12 (Top-5 non-TIOBE peek, lunar SVG body texture) |
| 04 | OG social card image | pending | item 1 (generate `assets/og-card.png`, may block on tooling) |

## Default decisions (baked into the plan; flag now if any need to change)

1. **Empty KIM in TIOBE view** → hide the card entirely. The 5-element wheel is preserved in all-langs view. Cleaner than "0 ngôn ngữ".
2. **5-card-row symbolism** → keep `auto-fit minmax(220px, 1fr)`. Page max-width stays 880 px.
3. **URL persistence scope** → 3 toggles only via query params (`?source=…&view=…&sort=…`). No anchor-scroll state.
4. **GitLab tooltip mechanism** → small visible inline note next to source toggle that swaps text when GitLab is selected ("91 ngôn ngữ — palette riêng so với GitHub"). Plus `title` attr on the source-toggle group.
5. **AA contrast policy** → keep current best-effort (post-fix worst case Swift/MATLAB ~3.5–4.0:1). Document in a one-line CSS comment near `.chip`.
6. **OG image** → try `design` skill HTML→PNG first. Fallback: hand-crafted static SVG of the 5-element ribbon + title text.

## Dependencies

- Phase 02 follows Phase 01 (HTML markup stable before JS wiring).
- Phase 03 follows Phase 02 (uses URL state pattern for shareable peek state).
- Phase 04 independent; runs in parallel or last.

## Constraints

- No build step. Vanilla HTML/CSS/ES modules only.
- No webfont fetches; system stack only.
- All edits target existing files. New file allowed only for `assets/og-card.png`.
- Manual verification via `python3 -m http.server 8765` after each phase.
- Re-run `js/classify-element.test.html` if any classifier change (none planned).

## References

- Live review: `plans/reports/ui-ux-260427-2043-fengshui-page-review.md`
- Live todo: `plans/todo.md`
- Algorithm spec: `plans/reports/researcher-260427-0854-nguhanh-color-classifier.md`
- KIM rule rationale: `plans/reports/brainstorm-260427-1046-kim-rebalance.md`
