import { classify, hexToHsl } from './classify-element.js';
import {
  renderGrid,
  renderError,
  renderDebugPanel,
  isBorderline,
  mountSegmentedControl,
} from './render-elements.js';
import { TIOBE_TOP } from './tiobe-top.js';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const LEGEND_TEXT =
  'Phân loại theo tông màu HSL: đỏ/tím/cam đậm → HOẢ, xanh lá/cyan → MỘC, xanh dương → THUỶ, vàng/nâu → THỔ, trắng/xám sáng → KIM.';

const SOURCES = {
  github: { url: './data/github-colors.json', label: 'GitHub' },
  gitlab: { url: './data/gitlab-colors.json', label: 'GitLab' },
};
const DEFAULT_SOURCE = 'github';

const VIEW_OPTIONS = [
  { key: 'tiobe', label: 'TIOBE Top 20' },
  { key: 'all', label: 'Tất cả ngôn ngữ' },
];
const SORT_OPTIONS = [
  { key: 'tiobe', label: 'Mặc định' },
  { key: 'alpha', label: 'A–Z' },
  { key: 'hue', label: 'Cầu vồng' },
];

// Short keys keep the URL readable when shared.
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
  const next = qs ? `?${qs}${window.location.hash}` : window.location.pathname + window.location.hash;
  history.replaceState(null, '', next);
}

const refs = {
  grid: null,
  legend: null,
  section: null,
  debug: null,
  sourceTag: null,
  sourceNote: null,
};

let lastBuckets = null;
let currentSort = 'tiobe';

function classifyAll(data) {
  const buckets = { kim: [], moc: [], thuy: [], hoa: [], tho: [] };
  const skipped = [];
  const borderline = [];

  for (const [name, entry] of Object.entries(data)) {
    const color = entry && entry.color;
    if (!color || !HEX_RE.test(color)) {
      skipped.push({ name });
      continue;
    }
    const element = classify(color);
    const rank = TIOBE_TOP[name] || null;
    buckets[element].push({ name, color, rank });
    if (isBorderline(color)) borderline.push({ name, color, element });
  }

  return { buckets, skipped, borderline };
}

function sortBucket(langs, key) {
  const byAlpha = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  if (key === 'alpha') return [...langs].sort(byAlpha);
  if (key === 'hue') {
    return [...langs].sort((a, b) => {
      const ha = a.color ? hexToHsl(a.color).h : 999;
      const hb = b.color ? hexToHsl(b.color).h : 999;
      return ha - hb || byAlpha(a, b);
    });
  }
  // 'tiobe' default — TIOBE-ranked first, then alphabetical
  return [...langs].sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    if (a.rank) return -1;
    if (b.rank) return 1;
    return byAlpha(a, b);
  });
}

function applySortAndRender() {
  if (!lastBuckets) return;
  const sorted = {};
  for (const [key, langs] of Object.entries(lastBuckets)) {
    sorted[key] = sortBucket(langs, currentSort);
  }
  renderGrid(sorted, refs.grid);
}

async function loadAndRender(sourceKey) {
  const source = SOURCES[sourceKey] || SOURCES[DEFAULT_SOURCE];
  try {
    const res = await fetch(source.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const { buckets, skipped, borderline } = classifyAll(data);

    lastBuckets = buckets;
    applySortAndRender();
    if (refs.legend) refs.legend.textContent = LEGEND_TEXT;
    if (refs.sourceTag) {
      // First child is the text node; preserve the `#source-note` span sibling.
      const first = refs.sourceTag.firstChild;
      const tagText = `Nguồn: ${source.label} Linguist `;
      if (first && first.nodeType === Node.TEXT_NODE) first.nodeValue = tagText;
      else refs.sourceTag.prepend(document.createTextNode(tagText));
    }
    if (refs.sourceNote) {
      if (sourceKey === 'gitlab') {
        refs.sourceNote.hidden = false;
        refs.sourceNote.textContent = '91 ngôn ngữ — palette riêng so với GitHub';
      } else {
        refs.sourceNote.hidden = true;
        refs.sourceNote.textContent = '';
      }
    }
    renderDebugPanel({ skipped, borderline }, refs.debug);
  } catch (err) {
    console.error('[programming-fengshui] failed to render modern grid:', err);
    renderError(
      `Không tải được dữ liệu màu (${err.message}). Mở qua HTTP server thay vì file://.`,
      refs.section,
    );
  }
}

function init() {
  const section = document.querySelector('main .elements');
  refs.grid = document.getElementById('element-grid');
  refs.legend = section?.querySelector('.legend') ?? null;
  refs.section = section;
  refs.debug = document.getElementById('debug-panel');
  refs.sourceTag = document.getElementById('source-tag');
  refs.sourceNote = document.getElementById('source-note');

  // Seed toggle defaults from URL query params; clamp unknown values.
  const initial = readQueryState();
  const validSource = SOURCES[initial.source] ? initial.source : DEFAULT_SOURCE;
  const validView = VIEW_OPTIONS.some((o) => o.key === initial.view) ? initial.view : 'tiobe';
  const validSort = SORT_OPTIONS.some((o) => o.key === initial.sort) ? initial.sort : 'tiobe';

  currentSort = validSort;
  // Apply view class BEFORE first render so renderGrid sees the right state
  // (drives the empty-card hide logic in render-elements.js).
  if (validView === 'all') section?.classList.add('show-all');

  const sourceToggleEl = document.getElementById('source-toggle');
  sourceToggleEl?.setAttribute('title', 'GitHub có 664 ngôn ngữ; GitLab có 91 và dùng palette riêng');

  mountSegmentedControl(
    sourceToggleEl,
    Object.entries(SOURCES).map(([key, s]) => ({ key, label: s.label })),
    validSource,
    (key) => { writeQueryParam('source', key, DEFAULT_SOURCE); loadAndRender(key); },
    'Nguồn dữ liệu màu',
  );
  mountSegmentedControl(
    document.getElementById('view-toggle'),
    VIEW_OPTIONS,
    validView,
    (key) => {
      writeQueryParam('view', key, 'tiobe');
      section?.classList.toggle('show-all', key === 'all');
      applySortAndRender();
    },
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
