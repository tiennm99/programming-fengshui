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
  // Pick whichever of black/white scores higher WCAG contrast on this bg.
  // Old 0.5 luminance threshold sent white onto mid-tones like #dea584 (Rust)
  // → 2.14:1 ratio, well below AA. Computing both ratios fixes the long tail.
  const L = relLuminance(hex);
  const ratioBlack = (L + 0.05) / 0.05;
  const ratioWhite = 1.05 / (L + 0.05);
  return ratioBlack >= ratioWhite ? '#111' : '#fff';
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

export function mountSourceToggle(mountEl, sources, defaultKey, onChange) {
  if (!mountEl || !sources?.length) return;
  const tablist = document.createElement('div');
  tablist.className = 'source-toggle';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Nguồn dữ liệu màu');

  const buttons = sources.map(({ key, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.role = 'tab';
    btn.className = 'source-toggle-btn';
    btn.dataset.source = key;
    btn.textContent = label;
    btn.setAttribute('aria-selected', String(key === defaultKey));
    btn.tabIndex = key === defaultKey ? 0 : -1;
    btn.addEventListener('click', () => activate(key));
    tablist.appendChild(btn);
    return btn;
  });

  tablist.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const i = buttons.indexOf(document.activeElement);
    let next;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    else if (e.key === 'ArrowLeft') next = (i <= 0 ? buttons.length : i) - 1;
    else next = (i + 1) % buttons.length;
    buttons[next].focus();
    activate(buttons[next].dataset.source);
  });

  function activate(key) {
    for (const b of buttons) {
      const active = b.dataset.source === key;
      b.setAttribute('aria-selected', String(active));
      b.tabIndex = active ? 0 : -1;
    }
    if (typeof onChange === 'function') onChange(key);
  }

  mountEl.replaceChildren(tablist);
}

export function mountViewToggle(mountEl, scopeEl) {
  if (!mountEl || !scopeEl) return;
  const views = [
    { key: 'tiobe', label: 'TIOBE Top 20' },
    { key: 'all', label: 'Tất cả ngôn ngữ' },
  ];
  const DEFAULT_VIEW = 'tiobe';

  const tablist = document.createElement('div');
  tablist.className = 'view-toggle';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Phạm vi hiển thị ngôn ngữ');

  const buttons = views.map(({ key, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.role = 'tab';
    btn.className = 'view-toggle-btn';
    btn.dataset.view = key;
    btn.textContent = label;
    btn.setAttribute('aria-selected', String(key === DEFAULT_VIEW));
    btn.tabIndex = key === DEFAULT_VIEW ? 0 : -1;
    btn.addEventListener('click', () => activate(key));
    tablist.appendChild(btn);
    return btn;
  });

  tablist.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const i = buttons.indexOf(document.activeElement);
    let next;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    else if (e.key === 'ArrowLeft') next = (i <= 0 ? buttons.length : i) - 1;
    else next = (i + 1) % buttons.length;
    buttons[next].focus();
    activate(buttons[next].dataset.view);
  });

  function activate(key) {
    for (const b of buttons) {
      const active = b.dataset.view === key;
      b.setAttribute('aria-selected', String(active));
      b.tabIndex = active ? 0 : -1;
    }
    scopeEl.classList.toggle('show-all', key === 'all');
  }

  mountEl.replaceChildren(tablist);
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
