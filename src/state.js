// Estado da ficha: values[nomeDoCampoNoPDF] = string | true. Funções puras; storage é injetado.
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
  return null;
}

export function exportJson(state) {
  return JSON.stringify({ v: state.v, slide: state.slide, values: state.values }, null, 2);
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
  return { ok: true, state: { v: VERSION, slide: data.slide, values: { ...data.values } } };
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

export function saveState(storage, state) {
  try {
    if (!storage) return false;
    storage.setItem(KEY, exportJson(state));
    return true;
  } catch {
    return false;
  }
}
