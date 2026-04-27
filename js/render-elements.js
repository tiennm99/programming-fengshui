import { ELEMENTS, hexToHsl } from './classify-element.js';

function pickTextColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? 'black' : 'white';
}

function buildChip(name, color) {
  const span = document.createElement('span');
  span.className = 'chip';
  span.textContent = name;
  if (color) {
    span.style.background = color;
    span.style.color = pickTextColor(color);
    span.title = color;
  }
  return span;
}

export function renderGrid(buckets, mountEl) {
  if (!mountEl) return;
  const fragment = document.createDocumentFragment();
  for (const { key, label } of ELEMENTS) {
    const langs = buckets[key] || [];
    const card = document.createElement('article');
    card.className = `card ${key}`;
    const h3 = document.createElement('h3');
    h3.textContent = label;
    const count = document.createElement('small');
    count.className = 'card-count';
    count.textContent = `${langs.length} ngôn ngữ`;
    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const { name, color } of langs) chips.appendChild(buildChip(name, color));
    card.append(h3, count, chips);
    fragment.appendChild(card);
  }
  mountEl.replaceChildren(fragment);
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
