// Reserved hashes: #classic, #modern. Do not reuse for in-page anchors.

const MODES = ['classic', 'modern'];
const DEFAULT_MODE = 'classic';

function readHash() {
  const h = (location.hash || '').replace('#', '');
  return MODES.includes(h) ? h : DEFAULT_MODE;
}

function setMode(mode, { writeHash = true, push = false } = {}) {
  if (!MODES.includes(mode)) mode = DEFAULT_MODE;

  for (const m of MODES) {
    const panel = document.getElementById(`panel-${m}`);
    const tab = document.getElementById(`tab-${m}`);
    if (panel) panel.hidden = m !== mode;
    if (tab) {
      tab.setAttribute('aria-selected', String(m === mode));
      tab.tabIndex = m === mode ? 0 : -1;
    }
  }

  if (writeHash) {
    const target = '#' + mode;
    if (push) {
      location.hash = target;
    } else if (location.hash !== target) {
      history.replaceState(null, '', target);
    }
  }
}

function onTabClick(e) {
  setMode(e.currentTarget.dataset.mode, { push: true });
}

function onTabListKeydown(e) {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
  if (!keys.includes(e.key)) return;
  e.preventDefault();
  const tabs = MODES.map((m) => document.getElementById(`tab-${m}`));
  const current = tabs.indexOf(document.activeElement);
  let next;
  if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = tabs.length - 1;
  else if (e.key === 'ArrowLeft') next = (current <= 0 ? tabs.length : current) - 1;
  else next = (current + 1) % tabs.length;
  const target = tabs[next];
  if (target) {
    target.focus();
    setMode(target.dataset.mode, { push: true });
  }
}

function onHashChange() {
  setMode(readHash(), { writeHash: false });
}

document.addEventListener('DOMContentLoaded', () => {
  for (const m of MODES) {
    const tab = document.getElementById(`tab-${m}`);
    if (tab) tab.addEventListener('click', onTabClick);
  }
  const list = document.querySelector('[role="tablist"]');
  if (list) list.addEventListener('keydown', onTabListKeydown);
  setMode(readHash(), { writeHash: false });
});

window.addEventListener('hashchange', onHashChange);
