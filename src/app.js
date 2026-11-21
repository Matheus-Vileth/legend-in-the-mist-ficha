// Interface do carrossel: renderiza os slides a partir de fieldmap.js e liga estado, PDF e save.
import { SLIDES } from './fieldmap.js';
import { TOTAL_SLIDES, clampSlide, nextSlide, prevSlide } from './carousel.js';
import {
  setValue, setExclusive, setSlide, loadState, saveState, exportJson, importJson,
} from './state.js';
import { fillSheet, sheetFileName } from './pdf.js';

const $ = (sel) => document.querySelector(sel);
const storage = (() => {
  try { return window.localStorage; } catch { return null; }
})();

let state = loadState(storage);
state = setSlide(state, clampSlide(state.slide));
let fieldSeq = 0;

// Grupos que começam recolhidos (opcionais ao criar o herói).
const COLLAPSED = new Set(['Melhorias especiais', 'Notas', 'Notas adicionais']);

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k in el && k !== 'list') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...children.flat().filter((c) => c != null && c !== false));
  return el;
}

function commit(next) {
  state = next;
  const ok = saveState(storage, state);
  $('#save-note').textContent = ok
    ? 'Salvo automaticamente neste navegador.'
    : 'Não foi possível salvar neste navegador. Baixe o save (.json) no último slide.';
}

function showStatus(message, kind = 'ok') {
  const el = $('#status');
  el.textContent = message;
  el.className = `status ${kind}`;
}

// ---------- campos ----------
function textField(f) {
  const id = `f${fieldSeq++}`;
  const listId = f.options ? `${id}-list` : null;
  const input = h('input', {
    type: 'text', id, value: state.values[f.name] ?? '', autocomplete: 'off', maxLength: 500,
    list: listId, onInput: (e) => commit(setValue(state, f.name, e.target.value)),
  });
  if (listId) input.setAttribute('list', listId);
  return h(
    'div', { class: 'field' },
    h('label', { htmlFor: id }, f.label),
    h('div', { class: 'row' }, input),
    listId ? h('datalist', { id: listId }, f.options.map((o) => h('option', { value: o }))) : null,
  );
}

function checkChip(f, onChange, small = false) {
  const input = h('input', { type: 'checkbox', checked: !!state.values[f.name], onChange });
  input.dataset.name = f.name;
  return h('label', { class: small ? 'chip small' : 'chip' }, input, f.label);
}

function plainCheck(f) {
  return checkChip(f, (e) => commit(setValue(state, f.name, e.target.checked)));
}

function exclusiveChecks(group) {
  const names = group.fields.map((f) => f.name);
  const wrap = h('div', { class: 'chips' });
  const onChange = (name) => (e) => {
    commit(setExclusive(state, names, e.target.checked ? name : null));
    for (const box of wrap.querySelectorAll('input')) box.checked = !!state.values[box.dataset.name];
  };
  wrap.append(...group.fields.map((f) => checkChip(f, onChange(f.name))));
  return wrap;
}

function groupBody(group) {
  if (group.exclusive) return [exclusiveChecks(group)];
  const out = [];
  let texts = null;
  let chips = null;
  for (const f of group.fields) {
    if (f.kind === 'check' && f.label === 'riscada') {
      // "riscada" fica na mesma linha da tag anterior.
      const row = texts.lastElementChild.querySelector('.row');
      row.append(checkChip(f, (e) => commit(setValue(state, f.name, e.target.checked)), true));
    } else if (f.kind === 'check') {
      texts = null;
      if (!chips) { chips = h('div', { class: 'chips' }); out.push(chips); }
      chips.append(plainCheck(f));
    } else {
      chips = null;
      if (!texts) { texts = h('div', { class: 'fields' }); out.push(texts); }
      texts.append(textField(f));
    }
  }
  return out;
}

function renderGroup(group) {
  const body = groupBody(group);
  if (COLLAPSED.has(group.label)) return h('details', {}, h('summary', {}, `${group.label} (opcional)`), body);
  return h('section', {}, h('h3', {}, group.label), body);
}

// ---------- slides ----------
function renderEdit(slide) {
  return h('div', {}, h('h2', { tabIndex: -1 }, slide.title), h('p', { class: 'hint' }, slide.hint), slide.groups.map(renderGroup));
}

function themeSummary(i) {
  const slide = SLIDES[1 + i];
  const fields = slide.groups.flatMap((g) => g.fields);
  const title = state.values[fields.find((f) => f.role === 'power0').name];
  const type = state.values[fields.find((f) => f.label === 'Tipo de tema').name];
  const might = slide.groups.find((g) => g.exclusive).fields.find((f) => state.values[f.name])?.label;
  const tags = fields.filter((f) => /^power/.test(f.role ?? '') && state.values[f.name]).length;
  return { n: i + 1, title, type, might, tags };
}

function renderReview() {
  const name = state.values['Character Name'];
  const cards = [0, 1, 2, 3].map((i) => {
    const t = themeSummary(i);
    const meta = [t.type, t.might, `${t.tags} tag(s) de poder`].filter(Boolean).join(' · ');
    return h('div', { class: 'card' }, h('b', {}, `Tema ${t.n}: `), t.title || '(sem título)', h('div', { class: 'muted small' }, meta));
  });
  const fileInput = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onChange: onImport });
  return h(
    'div', {},
    h('h2', { tabIndex: -1 }, 'Revisão e download'),
    h('p', { class: 'hint' }, 'Confira o resumo. O PDF baixado é a ficha oficial preenchida (os rótulos impressos são em inglês; o que você escreveu fica em português). O save (.json) permite reabrir e editar depois.'),
    h('div', { class: 'summary' },
      h('div', { class: 'card' }, h('b', {}, 'Personagem: '), name || '(sem nome)', h('div', { class: 'muted small' }, `Jogador: ${state.values['Player Name'] || '—'}`)),
      cards),
    h('div', { class: 'actions' },
      h('button', { type: 'button', class: 'btn primary', onClick: onDownloadPdf }, 'Baixar PDF da ficha'),
      h('button', { type: 'button', class: 'btn', onClick: onDownloadJson }, 'Baixar save (.json)'),
      h('button', { type: 'button', class: 'btn', onClick: () => fileInput.click() }, 'Abrir save (.json)'),
      fileInput),
  );
}

// ---------- downloads ----------
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
    showStatus('PDF gerado.');
  } catch (e) {
    showStatus(`Não foi possível gerar o PDF: ${e.message}`, 'err');
  }
}

function onDownloadJson() {
  const base = sheetFileName(state.values['Character Name']).replace(/^ficha-/, 'save-').replace(/\.pdf$/, '.json');
  download(new Blob([exportJson(state)], { type: 'application/json' }), base);
  showStatus('Save gerado.');
}

async function onImport(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const r = importJson(await file.text());
  if (!r.ok) { showStatus(r.error, 'err'); return; }
  commit(setSlide(r.state, clampSlide(r.state.slide)));
  render();
  showStatus('Save carregado.');
}

// ---------- navegação ----------
function go(i, focus = true) {
  commit(setSlide(state, clampSlide(i)));
  showStatus('', 'ok');
  render();
  if (focus) {
    window.scrollTo(0, 0);
    $('#slide h2')?.focus({ preventScroll: true });
  }
}

function render() {
  fieldSeq = 0;
  const slide = $('#slide');
  slide.replaceChildren(state.slide < SLIDES.length ? renderEdit(SLIDES[state.slide]) : renderReview());
  $('#prev').disabled = state.slide === 0;
  $('#next').disabled = state.slide === TOTAL_SLIDES - 1;
  $('#counter').textContent = `${state.slide + 1} / ${TOTAL_SLIDES}`;
  const titles = [...SLIDES.map((s) => s.title), 'Revisão e download'];
  $('#dots').replaceChildren(...titles.map((t, i) => h('li', {},
    h('button', {
      type: 'button', class: 'dot', 'aria-label': `Slide ${i + 1}: ${t}`, title: t,
      'aria-current': i === state.slide ? 'step' : false, onClick: () => go(i),
    }))));
}

$('#prev').addEventListener('click', () => go(prevSlide(state.slide)));
$('#next').addEventListener('click', () => go(nextSlide(state.slide)));
document.addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input, textarea, select, [contenteditable]')) return;
  if (e.key === 'ArrowRight') go(nextSlide(state.slide));
  if (e.key === 'ArrowLeft') go(prevSlide(state.slide));
});

commit(state);
render();
