// Auxiliares de DOM e de imagens da interface.
import { eventName } from './dom.js';

/** Cria um elemento. Props onX viram eventos; false/null são ignorados; filhos null/false são ignorados. */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (eventName(k)) el.addEventListener(eventName(k), v);
    else if (k.startsWith('aria-') || k.startsWith('data-') || k === 'list' || k === 'role') el.setAttribute(k, v === true ? '' : v);
    else if (k in el) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...children.flat().filter((c) => c != null && c !== false));
  return el;
}

/** Data URI de uma imagem de assets/ui-hd (embutida no build em window.__UI__). */
export const ui = (name) => (typeof window !== 'undefined' && window.__UI__?.[name]) || '';

export const img = (name, attrs = {}) => h('img', { src: ui(name), alt: '', ...attrs });
