// Casca do site: tela inicial, abas, lateral de passos, rodapé. Liga estado, PDF e save.
import { SLIDES } from './fieldmap.js';
import {
  TOTAL_SLIDES, SECTION_LABELS, slideIdAt, clampSlide, nextSlide, prevSlide, sectionOf, firstSlideOf, stepLabel, slideTitle,
} from './carousel.js';
import {
  createState, setSlide, loadState, saveState, clearState, exportJson, importJson, hasSaved,
} from './state.js';
import { fillSheet, sheetFileName } from './pdf.js';
import { h, img } from './ui.js';
import { renderStep } from './steps.js';
import { renderReview } from './review.js';
import { renderHome } from './home.js';
import { confirmDialog } from './dialog.js';
import { guardWindowDrops } from './portrait-ui.js';
import { createGuide } from './guide-ui.js';

const storage = (() => {
  try { return window.localStorage; } catch { return null; }
})();

let state = loadState(storage);
let savedAt = state.savedAt;
state = setSlide(state, clampSlide(state.slide));

const TABS = [
  ['personagem', 'ic-pessoa'], ['temas', 'ic-estrela'], ['detalhes', 'ic-livro'], ['exportar', 'ic-baixar'],
];
const SAVE_OK = 'Salvo neste navegador';
const SAVE_FAIL = 'Sem salvamento automático aqui — baixe o save (.json)';

// ---------- casca ----------
const homeEl = h('section', { id: 'home', 'aria-label': 'Tela inicial' });
const saveNote = h('span', { class: 'save-note', role: 'status' }, storage ? SAVE_OK : SAVE_FAIL);
if (!storage) saveNote.classList.add('warn');
const tabEls = TABS.map(([section, icon]) =>
  h('button', { type: 'button', class: 'tab', role: 'tab', 'aria-selected': 'false', 'data-section': section, onClick: () => go(firstSlideOf(section)) },
    img(icon), SECTION_LABELS[section]));
const homeIcon = (() => {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  for (const [k, v] of Object.entries({ viewBox: '0 0 24 24', width: '22', height: '22', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) svg.setAttribute(k, v);
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M3 11.5 12 4l9 7.5M5.5 10v9.5h4.5v-6h4v6h4.5V10');
  svg.append(path);
  return svg;
})();
const homeBtn = h('button', { type: 'button', class: 'btn ghost icononly menu-btn', title: 'Voltar ao início', 'aria-label': 'Voltar ao início', onClick: () => showHome(true) }, homeIcon);
const guide = createGuide({ storage, onChange: () => render() });
const topbar = h('nav', { class: 'topbar', role: 'tablist', 'aria-label': 'Seções da ficha' },
  ...tabEls, saveNote, guide.toggle, homeBtn);

const stepEls = Array.from({ length: TOTAL_SLIDES }, (_, i) =>
  h('button', { type: 'button', class: 'step', onClick: () => go(i) }, h('span', { class: 'n' }, String(i + 1)), slideTitle(i)));
const side = h('aside', { class: 'side' },
  img('logo', { class: 'logo', alt: 'Legend in the Mist' }),
  img('divisor-a', { class: 'rule' }),
  h('ol', { class: 'steps' }, ...stepEls.map((b) => h('li', {}, b))));

const view = h('div', { id: 'view' });
const stage = h('main', { class: 'stage' }, img('borboleta', { class: 'deco', style: 'right:14px;top:-6px;width:46px' }), guide.el, view);

const stepLabelEl = h('p', { class: 'steplabel' });
const pbar = h('div', { class: 'pbar' });
const prevBtn = h('button', { type: 'button', class: 'btn ghost', onClick: () => go(prevSlide(state.slide)) }, '← Anterior');
const nextBtn = h('button', { type: 'button', class: 'btn primary', onClick: () => go(nextSlide(state.slide)) }, 'Próximo →');
const bottom = h('div', { class: 'bottom' },
  stepLabelEl, prevBtn, h('div', { class: 'mid' }, pbar),
  h('div', { class: 'right' },
    h('button', { type: 'button', class: 'btn ghost icononly', title: 'Baixar save (.json)', 'aria-label': 'Baixar save (.json)', onClick: () => onDownloadJson() }, img('ic-disquete')),
    nextBtn));

document.getElementById('root').append(homeEl, h('div', { class: 'app' }, topbar, side, stage, bottom));

// ---------- estado e avisos ----------
function commit(next) {
  state = next;
  const ok = saveState(storage, state);
  if (ok) savedAt = Date.now();
  saveNote.textContent = ok ? SAVE_OK : SAVE_FAIL;
  saveNote.classList.toggle('warn', !ok);
}

function aviso(id, message, kind = 'ok') {
  const el = document.getElementById(id);
  if (!el) return;
  el.hidden = !message;
  el.textContent = message ? `${kind === 'err' ? '⚠' : '✔'} ${message}` : '';
  el.className = kind === 'err' ? 'aviso err' : 'aviso';
}

const stepCtx = { getState: () => state, commit, link: (t) => guide.link(t), typeInfo: (n) => guide.typeInfo(n), peekType: (n) => guide.peekType(n) };

// ---------- downloads e save ----------
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function onDownloadPdf() {
  try {
    const b64 = window.__FICHA_PDF_B64__;
    if (!b64) throw new Error('PDF oficial não encontrado nesta página.');
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const out = await fillSheet(bytes, state.values);
    download(new Blob([out], { type: 'application/pdf' }), sheetFileName(state.values['Character Name']));
    aviso('status', 'PDF gerado.');
  } catch (e) {
    aviso('status', `Não foi possível gerar o PDF: ${e.message}`, 'err');
  }
}

function onDownloadJson() {
  const name = sheetFileName(state.values['Character Name']).replace(/^ficha-/, 'save-').replace(/\.pdf$/, '.json');
  download(new Blob([exportJson(state)], { type: 'application/json' }), name);
  aviso('status', 'Save gerado.');
}

async function readSave(file) {
  const r = importJson(await file.text());
  if (!r.ok) return r;
  state = setSlide(r.state, clampSlide(r.state.slide));
  savedAt = r.state.savedAt;
  commit(state);
  return r;
}

async function onImportInApp(file) {
  const r = await readSave(file);
  if (!r.ok) { aviso('status', r.error, 'err'); return; }
  render();
  aviso('status', 'Save carregado.');
}

async function onOpenFileInHome(file) {
  const r = await readSave(file);
  showHome(true);
  aviso('home-status', r.ok ? 'Save carregado.' : r.error, r.ok ? 'ok' : 'err');
}

// ---------- tela inicial ----------
const ASK_NEW = {
  title: 'Novo herói',
  message: 'Começar um novo herói apaga o personagem salvo neste navegador. Baixe o save (.json) antes se quiser guardá-lo.',
  confirmLabel: 'Apagar e começar',
};
const ASK_DELETE = {
  title: 'Apagar personagem',
  message: 'Isso não pode ser desfeito. Baixe o save (.json) antes se quiser guardá-lo.',
  confirmLabel: 'Apagar',
};

function resetCharacter() {
  state = createState();
  savedAt = undefined;
  clearState(storage);
}

const homeCtx = {
  getState: () => state,
  getSavedAt: () => savedAt,
  onNew: async () => {
    if (hasSaved(state) && !(await confirmDialog(ASK_NEW))) return;
    resetCharacter();
    go(0, false);
    showHome(false);
  },
  onResume: () => { go(state.slide, false); showHome(false); },
  onDelete: async () => {
    if (!(await confirmDialog(ASK_DELETE))) return;
    resetCharacter();
    showHome(true);
  },
  onOpenFile: onOpenFileInHome,
};

function showHome(on) {
  document.body.classList.toggle('home-on', on);
  if (on) homeEl.replaceChildren(...renderHome(homeCtx));
  window.scrollTo(0, 0);
}

// ---------- navegação ----------
function render() {
  const i = state.slide;
  const reviewCtx = { getState: () => state, onPdf: onDownloadPdf, onJson: onDownloadJson, onImport: onImportInApp, link: (t) => guide.link(t) };
  guide.update(slideIdAt(i));
  view.replaceChildren(i < SLIDES.length ? renderStep(i, stepCtx) : renderReview(reviewCtx));
  const section = sectionOf(i);
  for (const t of tabEls) t.setAttribute('aria-selected', String(t.getAttribute('data-section') === section));
  stepEls.forEach((b, k) => {
    if (k === i) b.setAttribute('aria-current', 'step');
    else b.removeAttribute('aria-current');
    b.classList.toggle('done', k < i);
  });
  stepLabelEl.textContent = stepLabel(i);
  pbar.replaceChildren(...Array.from({ length: TOTAL_SLIDES }, (_, k) => h('i', { class: k <= i ? 'on' : '' })));
  prevBtn.disabled = i === 0;
  nextBtn.hidden = i === TOTAL_SLIDES - 1;
}

function go(i, focus = true) {
  commit(setSlide(state, clampSlide(i)));
  render();
  if (focus) {
    window.scrollTo(0, 0);
    view.querySelector('h1')?.focus({ preventScroll: true });
  }
}

document.addEventListener('keydown', (e) => {
  if (document.body.classList.contains('home-on')) return;
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input, textarea, select, [contenteditable], [role="dialog"]')) return;
  if (e.key === 'ArrowRight') go(nextSlide(state.slide));
  if (e.key === 'ArrowLeft') go(prevSlide(state.slide));
});

guardWindowDrops();
render();
showHome(true);
