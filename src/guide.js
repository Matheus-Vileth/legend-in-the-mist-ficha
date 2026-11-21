// Guia do jogo: funções puras (dicas, busca no glossário, termos nos textos, preferências).
import { fold, norm } from './text.js';
import { GLOSSARY, TIPS } from './guide-data.js';

export const GUIDE_KEY = 'lim-guia-v1';
export const defaultPrefs = () => ({ on: true, open: true });

/** Preferências do guia ({ on, open }); nunca lança e campo inválido volta ao padrão. */
export function loadPrefs(storage) {
  const base = defaultPrefs();
  try {
    const raw = storage?.getItem(GUIDE_KEY);
    if (!raw) return base;
    const d = JSON.parse(raw);
    return {
      on: typeof d?.on === 'boolean' ? d.on : base.on,
      open: typeof d?.open === 'boolean' ? d.open : base.open,
    };
  } catch {
    return base;
  }
}

export function savePrefs(storage, prefs) {
  try {
    if (!storage) return false;
    storage.setItem(GUIDE_KEY, JSON.stringify({ on: !!prefs.on, open: !!prefs.open }));
    return true;
  } catch {
    return false;
  }
}

export const tipsFor = (slideId) => [...(TIPS[slideId] ?? [])];
export const findTerm = (id) => GLOSSARY.find((t) => t.id === id) ?? null;

/** Termos que casam com a busca (pt, en e explicação, sem acento); vazio = todos. Começa-com vem antes; depois ordem alfabética. */
export function searchTerms(query, terms = GLOSSARY) {
  const q = norm(query ?? '');
  const alfa = (a, b) => a.pt.localeCompare(b.pt, 'pt');
  if (!q) return [...terms].sort(alfa);
  const casa = terms.filter((t) => [t.pt, t.en, t.curto].some((s) => norm(s).includes(q)));
  const comeca = (t) => norm(t.pt).startsWith(q) || norm(t.en).startsWith(q);
  return [...casa.filter(comeca).sort(alfa), ...casa.filter((t) => !comeca(t)).sort(alfa)];
}

/** Texto normalizado (sem acento/caixa) e, para cada unidade dele, a posição no texto original. */
function foldWithMap(text) {
  let folded = '';
  const map = [];
  for (let i = 0; i < text.length; ) {
    const ch = String.fromCodePoint(text.codePointAt(i));
    const f = fold(ch);
    for (let k = 0; k < f.length; k++) { folded += f[k]; map.push(i); }
    i += ch.length;
  }
  return { folded, map };
}

const isWordChar = (c) => c !== undefined && /[\p{L}\p{N}]/u.test(c);

/**
 * Parte um texto em trechos simples e termos do glossário. Só palavra inteira, sem acento/caixa, só a 1ª ocorrência de cada termo
 * (a que não se sobrepõe a um termo mais longo); termos de nome mais longo têm prioridade. Juntar os `v` devolve o texto original.
 * @returns {Array<{t: 'txt'|'termo', v: string, id?: string}>}
 */
export function linkTerms(text, terms = GLOSSARY) {
  if (!text) return [];
  const { folded, map } = foldWithMap(text);
  const ordem = terms
    .map((t) => ({ t, nomes: [t.pt, ...(t.apelidos ?? [])].map((n) => norm(n)).filter(Boolean) }))
    .filter((x) => x.nomes.length)
    .sort((a, b) => Math.max(...b.nomes.map((n) => n.length)) - Math.max(...a.nomes.map((n) => n.length)));
  const claimed = [];
  for (const { t, nomes } of ordem) {
    const candidatos = [];
    for (const nome of nomes) {
      for (let s = folded.indexOf(nome); s !== -1; s = folded.indexOf(nome, s + 1)) {
        const e = s + nome.length;
        if (!isWordChar(folded[s - 1]) && !isWordChar(folded[e])) candidatos.push([s, e]);
      }
    }
    candidatos.sort((a, b) => a[0] - b[0]);
    const livre = candidatos.find(([s, e]) => !claimed.some((c) => s < c.e && e > c.s));
    if (livre) claimed.push({ s: livre[0], e: livre[1], id: t.id });
  }
  claimed.sort((a, b) => a.s - b.s);
  const segs = [];
  let pos = 0;
  for (const c of claimed) {
    const ini = map[c.s];
    const fim = c.e < map.length ? map[c.e] : text.length;
    if (ini > pos) segs.push({ t: 'txt', v: text.slice(pos, ini) });
    segs.push({ t: 'termo', v: text.slice(ini, fim), id: c.id });
    pos = fim;
  }
  if (pos < text.length) segs.push({ t: 'txt', v: text.slice(pos) });
  return segs;
}
