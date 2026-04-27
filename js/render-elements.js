import { ELEMENTS, hexToHsl } from './classify-element.js';

// Relative luminance per WCAG 2.x — better than YIQ for mid-tones
// (e.g. saturated mid-greens / mid-reds where YIQ flips text color wrong).
function relLuminance(hex) {
  const v = (c) => {
    const x = parseInt(hex.slice(c, c + 2), 16) / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * v(1) + 0.7152 * v(3) + 0.0722 * v(5);
}

function pickTextColor(hex) {
  // Threshold tuned so saturated mid-tones (#d44950, #5d4037) get white text.
  return relLuminance(hex) > 0.5 ? '#1a1a1a' : '#ffffff';
}

function buildChip(name, color, { rank = null } = {}) {
  const span = document.createElement('span');
  span.className = 'chip' + (rank ? ' chip-tiobe' : ' chip-other');
  span.textContent = name;
  if (color) {
    span.style.background = color;
    span.style.color = pickTextColor(color);
    const hexLabel = color.toUpperCase();
    const tooltip = rank ? `${name} · ${hexLabel} · TIOBE #${rank}` : `${name} · ${hexLabel}`;
    span.title = tooltip;
    span.setAttribute('aria-label', tooltip);
  }
  if (rank) span.dataset.rank = String(rank);
  return span;
}

export function renderGrid(buckets, mountEl) {
  if (!mountEl) return;
  const fragment = document.createDocumentFragment();
  for (const { key, label } of ELEMENTS) {
    const langs = buckets[key] || [];
    const tiobeCount = langs.filter((l) => l.rank).length;
    const card = document.createElement('article');
    card.className = `card ${key}`;
    const h3 = document.createElement('h3');
    h3.textContent = label;
    const count = document.createElement('small');
    count.className = 'card-count';
    count.textContent = tiobeCount
      ? `${tiobeCount} TIOBE · ${langs.length - tiobeCount} khác`
      : `${langs.length} ngôn ngữ`;
    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const { name, color, rank } of langs) chips.appendChild(buildChip(name, color, { rank }));
    card.append(h3, count, chips);
    fragment.appendChild(card);
  }
  mountEl.replaceChildren(fragment);
}

export function mountViewToggle(mountEl, scopeEl) {
  if (!mountEl || !scopeEl) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'view-toggle-btn';
  const labels = {
    tiobe: 'Xem tất cả ngôn ngữ',
    all: 'Chỉ TIOBE Top 20',
  };
  function apply(view) {
    scopeEl.classList.toggle('show-all', view === 'all');
    btn.textContent = labels[view];
    btn.dataset.view = view;
    btn.setAttribute('aria-pressed', String(view === 'all'));
  }
  btn.addEventListener('click', () => apply(btn.dataset.view === 'all' ? 'tiobe' : 'all'));
  apply('tiobe');
  mountEl.replaceChildren(btn);
}

export function renderError(message, mountEl) {
  if (!mountEl) return;
  const p = document.createElement('p');
  p.className = 'render-error';
  p.textContent = message;
  mountEl.prepend(p);
}

const HUE_BOUNDARIES = [20, 40, 70, 200, 260];

export function isBorderline(hex) {
  const { h, s, l } = hexToHsl(hex);
  if (s >= 4 && s < 6) return true;
  if (s < 5) return (l >= 18 && l <= 22) || (l >= 68 && l <= 72);
  return HUE_BOUNDARIES.some((b) => Math.abs(h - b) <= 2);
}

export function renderDebugPanel({ skipped, borderline }, mountEl) {
  if (!mountEl) return;
  if (!skipped.length && !borderline.length) {
    mountEl.hidden = true;
    return;
  }

  const fragment = document.createDocumentFragment();
  const summary = document.createElement('summary');
  summary.textContent = `Kiểm tra tự động (${skipped.length} skipped · ${borderline.length} borderline)`;
  fragment.appendChild(summary);

  if (skipped.length) {
    const h4 = document.createElement('h4');
    h4.textContent = 'Bỏ qua (không có màu)';
    const list = document.createElement('div');
    list.className = 'chips';
    for (const { name } of skipped) list.appendChild(buildChip(name, null));
    fragment.append(h4, list);
  }

  if (borderline.length) {
    const h4 = document.createElement('h4');
    h4.textContent = 'Trường hợp ranh giới';
    const list = document.createElement('div');
    list.className = 'chips';
    for (const { name, color, element } of borderline) {
      const chip = buildChip(`${name} → ${element}`, color);
      chip.title = `${color} → ${element}`;
      list.appendChild(chip);
    }
    fragment.append(h4, list);
  }

  mountEl.replaceChildren(fragment);
  mountEl.hidden = false;
}
