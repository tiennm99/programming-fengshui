# Phase 02 — Functional toggles & tooltip

## Context

Items 2 (URL persistence), 3 (GitLab tooltip / disparity note), 4 (hide empty KIM card in TIOBE view). All target user-visible behaviour. JS-heavy: `js/main.js`, `js/render-elements.js`, plus markup in `index.html`.

## Overview

- **Priority:** P1 (functional)
- **Status:** pending — depends on Phase 01
- **Effort:** ~60 min hand-edit + 20 min manual verify across browsers
- **Risk:** medium — touches state initialization and render logic; potential regressions if URL-init order is wrong

## Files modified

- `js/main.js` — URL read/write, source-change tooltip update, default-view propagation
- `js/render-elements.js` — KIM card skip logic when bucket empty AND view=tiobe
- `index.html` — markup hook for the GitLab disparity note (one `<span>` slot)

## Implementation steps

### Item 2 — URL persistence (3 toggles)

Pattern: read URL params on `init()`, write on each toggle change. Use `history.replaceState` (no history pollution).

**1. New helpers in `js/main.js` (after the `SORT_OPTIONS` block, before `refs`):**

```js
const QUERY_KEYS = { source: 's', view: 'v', sort: 'o' };

function readQueryState() {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get(QUERY_KEYS.source) || DEFAULT_SOURCE,
    view: params.get(QUERY_KEYS.view) || 'tiobe',
    sort: params.get(QUERY_KEYS.sort) || 'tiobe',
  };
}

function writeQueryParam(key, value, defaultValue) {
  const params = new URLSearchParams(window.location.search);
  if (value === defaultValue) params.delete(QUERY_KEYS[key]);
  else params.set(QUERY_KEYS[key], value);
  const qs = params.toString();
  history.replaceState(null, '', qs ? `?${qs}${window.location.hash}` : window.location.pathname + window.location.hash);
}
```

Validation: clamp unknown values back to default. In each toggle's `onChange`, before calling the handler, check the key is in the known options list.

**2. Update `init()` to seed defaults from URL:**

```js
function init() {
  const section = document.querySelector('main .elements');
  refs.grid = document.getElementById('element-grid');
  refs.legend = section?.querySelector('.legend') ?? null;
  refs.section = section;
  refs.debug = document.getElementById('debug-panel');
  refs.sourceTag = document.getElementById('source-tag');

  const initial = readQueryState();
  const validSource = SOURCES[initial.source] ? initial.source : DEFAULT_SOURCE;
  const validView = VIEW_OPTIONS.some((o) => o.key === initial.view) ? initial.view : 'tiobe';
  const validSort = SORT_OPTIONS.some((o) => o.key === initial.sort) ? initial.sort : 'tiobe';

  currentSort = validSort;
  if (validView === 'all') section?.classList.add('show-all');

  mountSegmentedControl(
    document.getElementById('source-toggle'),
    Object.entries(SOURCES).map(([key, s]) => ({ key, label: s.label })),
    validSource,
    (key) => { writeQueryParam('source', key, DEFAULT_SOURCE); loadAndRender(key); },
    'Nguồn dữ liệu màu',
  );
  mountSegmentedControl(
    document.getElementById('view-toggle'),
    VIEW_OPTIONS,
    validView,
    (key) => { writeQueryParam('view', key, 'tiobe'); section?.classList.toggle('show-all', key === 'all'); applySortAndRender(); },
    'Phạm vi hiển thị ngôn ngữ',
  );
  mountSegmentedControl(
    document.getElementById('sort-toggle'),
    SORT_OPTIONS,
    validSort,
    (key) => { writeQueryParam('sort', key, 'tiobe'); currentSort = key; applySortAndRender(); },
    'Sắp xếp ngôn ngữ',
  );
  loadAndRender(validSource);
}
```

Note: view-toggle handler now also calls `applySortAndRender()` so the empty-card hide logic from Item 4 picks up the correct view state.

### Item 3 — GitLab disparity note + source-toggle tooltip

**1. Add a slot in `index.html:43` near the `#source-tag`:**

```html
<p class="mode-tag" id="source-tag">Nguồn: GitHub Linguist <span class="source-note" id="source-note" hidden></span></p>
```

**2. Style the note in `style.css` (append to `.mode-tag` block):**

```css
.source-note {
  display: inline-block;
  margin-left: 0.4rem;
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  background: var(--bg-tint);
  color: var(--accent-ink);
  font-size: 0.7rem;
  font-style: normal;
  font-weight: 600;
  letter-spacing: 0.2px;
}
```

**3. Update `loadAndRender()` in `js/main.js` to swap the note text:**

```js
if (refs.sourceTag) refs.sourceTag.firstChild.nodeValue = `Nguồn: ${source.label} Linguist `;
const note = document.getElementById('source-note');
if (note) {
  if (sourceKey === 'gitlab') {
    note.hidden = false;
    note.textContent = '91 ngôn ngữ — palette riêng so với GitHub';
  } else {
    note.hidden = true;
    note.textContent = '';
  }
}
```

**4. Add `title` attr on the source-toggle group** — set in `mountSegmentedControl` via the existing `ariaLabel` plumbing or set directly in `init()`:

```js
document.getElementById('source-toggle').setAttribute('title', 'GitHub có 664 ngôn ngữ; GitLab có 91 và dùng palette riêng');
```

### Item 4 — Hide empty KIM card in TIOBE view

`js/render-elements.js` `renderGrid()`:

```js
export function renderGrid(buckets, mountEl) {
  if (!mountEl) return;
  const showAll = mountEl.closest('.elements')?.classList.contains('show-all') ?? false;
  const fragment = document.createDocumentFragment();
  for (const { key, label } of ELEMENTS) {
    const langs = buckets[key] || [];
    /* In TIOBE view, hide cards with no languages — empty "0 ngôn ngữ"
       headings look broken. All-langs view keeps every card so the
       Ngũ Hành wheel stays visible. */
    if (!showAll && langs.length === 0) continue;
    /* … rest unchanged … */
  }
  mountEl.replaceChildren(fragment);
}
```

Caveat: if URL-init applies `show-all` to the section AFTER `renderGrid` is first called, the card list will be wrong for one frame. Phase 02 step 1 init order already adds `show-all` BEFORE `loadAndRender`, so this is safe.

## Todo list

- [ ] Item 2: URL helpers (`readQueryState`, `writeQueryParam`)
- [ ] Item 2: `init()` reads URL state, seeds toggles, writes on each change
- [ ] Item 2: validation — clamp unknown URL values to defaults
- [ ] Item 3: `#source-note` slot in `index.html`
- [ ] Item 3: `.source-note` CSS pill style
- [ ] Item 3: `loadAndRender` updates note text on source change
- [ ] Item 3: `title` attr on `#source-toggle`
- [ ] Item 4: hide empty cards in TIOBE view via `showAll` check in `renderGrid`
- [ ] Manual verify: load `?s=gitlab&v=all&o=hue` directly, share back to a peer, confirm state restores
- [ ] Manual verify: switch GitHub ↔ GitLab, confirm note shows/hides
- [ ] Manual verify: TIOBE view shows MỘC/THUỶ/HOẢ/THỔ only; all-langs shows all 5

## Success criteria

- Reload preserves all 3 toggle states.
- Sharing the URL recreates the same view in a fresh browser.
- Empty KIM card disappears in TIOBE view (since KIM has 0 TIOBE langs); reappears in all-langs.
- GitLab selection shows a small "91 ngôn ngữ — palette riêng so với GitHub" pill next to the source tag.
- Default URL stays clean (no params) when all toggles are at default.

## Risks & mitigations

- **Risk:** URL-init order: if `show-all` class is added after first render, cards flicker. **Mitigation:** apply class before `loadAndRender(validSource)` (already in step 1).
- **Risk:** `firstChild.nodeValue` overwrite assumes the `#source-tag` text node is first child. **Mitigation:** if the markup ever moves the `<span>` first, use `textContent` and rebuild the inner span — or restructure to two spans (tag + note) and set tag's `textContent` directly.
- **Risk:** GitLab pill may wrap on mobile. **Mitigation:** the parent `.mode-tag` already centres + breaks; `.source-note` is `inline-block` with small padding.
- **Risk:** Hiding empty cards changes the grid item count, which `auto-fit minmax(220px, 1fr)` re-flows — at desktop 880 px, 4 visible cards span the full width nicely (no awkward gap).

## Next steps

→ Phase 03: additive features (Top-5 non-TIOBE peek, lunar SVG body texture).
