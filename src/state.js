// Estado da ficha: values[nomeDoCampoNoPDF] = string | true. Funções puras; storage é injetado.
import { SLIDES } from './fieldmap.js';
import { TOTAL_SLIDES } from './carousel.js';

export const VERSION = 1;
const KEY = 'lim-ficha-v1';

export function createState() {
  return { v: VERSION, slide: 0, values: {} };
}

export function setValue(state, name, value) {
  const values = { ...state.values };
  if (value === '' || value === false || value == null) delete values[name];
  else values[name] = value;
  return { ...state, values };
}

export function setExclusive(state, names, chosen) {
  const values = { ...state.values };
  for (const n of names) delete values[n];
  if (chosen != null) values[chosen] = true;
  return { ...state, values };
}

export function setSlide(state, slide) {
  return { ...state, slide };
}

function validate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'Arquivo inválido: não é um save da ficha.';
  if (data.v !== VERSION) return `Versão do save não suportada (v${data.v}); esperada v${VERSION}.`;
  if (!Number.isInteger(data.slide) || data.slide < 0) return 'Arquivo inválido: slide ausente.';
  const vals = data.values;
  if (!vals || typeof vals !== 'object' || Array.isArray(vals)) return 'Arquivo inválido: valores ausentes.';
  for (const v of Object.values(vals)) {
    if (typeof v !== 'string' && v !== true) return 'Arquivo inválido: valor de campo inesperado.';
  }
  if ('savedAt' in data && !Number.isFinite(data.savedAt)) return 'Arquivo inválido: data de salvamento inesperada.';
  return null;
}

export function exportJson(state) {
  const out = { v: state.v, slide: state.slide, values: state.values };
  if (Number.isFinite(state.savedAt)) out.savedAt = state.savedAt;
  return JSON.stringify(out, null, 2);
}

export function importJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Arquivo inválido: não é JSON.' };
  }
  const error = validate(data);
  if (error) return { ok: false, error };
  const state = { v: VERSION, slide: data.slide, values: { ...data.values } };
  if ('savedAt' in data) state.savedAt = data.savedAt;
  return { ok: true, state };
}

export function loadState(storage) {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return createState();
    const r = importJson(raw);
    return r.ok ? r.state : createState();
  } catch {
    return createState();
  }
}

export function saveState(storage, state, now = Date.now()) {
  try {
    if (!storage) return false;
    storage.setItem(KEY, exportJson({ ...state, savedAt: now }));
    return true;
  } catch {
    return false;
  }
}

export function clearState(storage) {
  try {
    if (!storage) return false;
    storage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}

export const hasSaved = (state) => Object.keys(state.values).length > 0;

export function savedAgo(savedAt, now) {
  if (!Number.isFinite(savedAt)) return '';
  const diff = now - savedAt;
  if (diff < 60_000) return 'agora há pouco';
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(diff / 3_600_000);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(diff / 86_400_000);
  return d === 1 ? 'há 1 dia' : `há ${d} dias`;
}

const THEMES = SLIDES.filter((s) => s.section === 'temas').map((s) => {
  const fields = s.groups.flatMap((g) => g.fields);
  return {
    title: fields.find((f) => f.role === 'power0').name,
    type: fields.find((f) => f.label === 'Tipo de tema').name,
    mights: s.groups.find((g) => g.exclusive).fields,
    powers: fields.filter((f) => f.kind === 'text' && /^power\d$/.test(f.role ?? '')).map((f) => f.name),
  };
});

export function homeSummary(state) {
  return {
    name: state.values['Character Name'] ?? '',
    themes: THEMES.map((t) => state.values[t.title]).filter(Boolean),
    step: state.slide + 1,
    total: TOTAL_SLIDES,
  };
}

/** Resumo dos 4 temas para a tela de revisão. */
export function themeCards(state) {
  return THEMES.map((t, i) => ({
    n: i + 1,
    title: state.values[t.title] ?? '',
    type: state.values[t.type] ?? '',
    might: t.mights.find((f) => state.values[f.name])?.label ?? '',
    tags: t.powers.filter((n) => state.values[n]).length,
  }));
}
