import { classify } from './classify-element.js';
import {
  renderGrid,
  renderError,
  renderDebugPanel,
  isBorderline,
  mountViewToggle,
  mountSourceToggle,
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

const refs = {
  grid: null,
  legend: null,
  section: null,
  debug: null,
  sourceTag: null,
};

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

  for (const key of Object.keys(buckets)) {
    buckets[key].sort((a, b) => {
      if (a.rank && b.rank) return a.rank - b.rank;
      if (a.rank) return -1;
      if (b.rank) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  }

  return { buckets, skipped, borderline };
}

async function loadAndRender(sourceKey) {
  const source = SOURCES[sourceKey] || SOURCES[DEFAULT_SOURCE];
  try {
    const res = await fetch(source.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const { buckets, skipped, borderline } = classifyAll(data);

    renderGrid(buckets, refs.grid);
    if (refs.legend) refs.legend.textContent = LEGEND_TEXT;
    if (refs.sourceTag) refs.sourceTag.textContent = `Nguồn: ${source.label} Linguist`;
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

  mountSourceToggle(
    document.getElementById('source-toggle'),
    Object.entries(SOURCES).map(([key, s]) => ({ key, label: s.label })),
    DEFAULT_SOURCE,
    loadAndRender,
  );
  mountViewToggle(document.getElementById('view-toggle'), refs.section);
  loadAndRender(DEFAULT_SOURCE);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
