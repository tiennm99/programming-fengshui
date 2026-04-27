import { classify } from './classify-element.js';
import { renderGrid, renderError, renderDebugPanel, isBorderline } from './render-elements.js';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const LEGEND_TEXT =
  'Phân loại theo tông màu HSL: đỏ/tím/cam đậm → HOẢ, xanh lá/cyan → MỘC, xanh dương → THUỶ, vàng/nâu → THỔ, trắng/xám sáng → KIM.';

async function init() {
  const gridEl = document.getElementById('element-grid');
  const legendEl = document.querySelector('#panel-modern .legend');
  const elementsSection = document.querySelector('#panel-modern .elements');
  const debugEl = document.getElementById('debug-panel');

  try {
    const res = await fetch('./data/github-colors.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

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
      buckets[element].push({ name, color });
      if (isBorderline(color)) borderline.push({ name, color, element });
    }

    for (const key of Object.keys(buckets)) {
      buckets[key].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }

    renderGrid(buckets, gridEl);
    if (legendEl) legendEl.textContent = LEGEND_TEXT;
    renderDebugPanel({ skipped, borderline }, debugEl);
  } catch (err) {
    console.error('[programming-fengshui] failed to render modern grid:', err);
    renderError(`Không tải được dữ liệu màu (${err.message}). Mở qua HTTP server thay vì file://.`, elementsSection);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
