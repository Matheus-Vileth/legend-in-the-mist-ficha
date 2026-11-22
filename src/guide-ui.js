// Guia na tela: mascote Piu, balão de dicas acima do título, glossário e botão liga/desliga.
import { h, img } from './ui.js';
import { loadPrefs, savePrefs, tipsFor, linkTerms, searchTerms, findTerm } from './guide.js';
import { GLOSSARY } from './guide-data.js';

/**
 * @param {{storage: Storage|null, onChange?: () => void}} opts onChange roda quando liga/desliga (para redesenhar os textos com termos).
 * @returns {{el: HTMLElement, toggle: HTMLElement, update(slideId: string): void, link(text: string): Array<string|HTMLElement>, isOn(): boolean}}
 */
export function createGuide({ storage, onChange = () => {} }) {
  const prefs = loadPrefs(storage);
  let slideId = '';

  const el = h('section', { class: 'guide', 'aria-label': 'Guia do jogo' });
  const sw = h('span', { class: 'sw', 'aria-hidden': 'true' });
  const toggleText = h('span', {});
  const toggle = h('button', {
    type: 'button', class: 'btn ghost g-toggle', 'aria-pressed': String(prefs.on), title: 'Ligar ou desligar o guia',
    onClick: () => setOn(!prefs.on),
  }, img('passaro', { alt: '' }), toggleText, sw);

  const save = () => savePrefs(storage, prefs);

  function setOn(on) {
    prefs.on = on;
    if (on) prefs.open = true;
    save();
    onChange();
    paint();
  }

  function setOpen(open) {
    prefs.open = open;
    save();
    paint();
    el.querySelector(open ? '.balao' : '.piu')?.focus?.();
  }

  /** Texto -> trechos simples e botões de termo (só a 1ª ocorrência de cada termo). Guia desligado: texto puro. */
  function link(text) {
    if (!prefs.on) return [text];
    return linkTerms(text).map((s) =>
      s.t === 'termo'
        ? h('button', { type: 'button', class: 'termo', title: 'Ver no glossário', onClick: (e) => openGlossary(s.id, e.currentTarget) }, s.v)
        : s.v);
  }

  function linkedItem(text) {
    return h('li', {}, ...link(text));
  }

  function paint() {
    toggle.setAttribute('aria-pressed', String(prefs.on));
    toggleText.textContent = prefs.on ? 'Guia ligado' : 'Guia desligado';
    el.hidden = !prefs.on;
    if (!prefs.on) { el.replaceChildren(); return; }
    const piu = h('button', {
      type: 'button', class: 'piu', 'aria-expanded': String(prefs.open),
      'aria-label': prefs.open ? 'Piu, seu guia: recolher as dicas' : 'Piu, seu guia: mostrar as dicas',
      onClick: () => setOpen(!prefs.open),
    }, img('passaro', { alt: '' }));
    if (!prefs.open) { el.replaceChildren(h('div', { class: 'g--topo closed' }, piu)); return; }
    const tips = tipsFor(slideId);
    const balao = h('div', { class: 'balao', tabIndex: -1 },
      h('header', {}, h('span', {}, 'Piu, seu guia'),
        h('button', { type: 'button', 'aria-label': 'Recolher as dicas', title: 'Recolher', onClick: () => setOpen(false) }, '▾')),
      tips.length ? h('ul', {}, ...tips.map(linkedItem)) : h('p', {}, 'Sem dicas para este passo.'),
      h('footer', {},
        h('button', { type: 'button', class: 'btn ghost', onClick: (e) => openGlossary(null, e.currentTarget) }, 'Glossário'),
        h('button', { type: 'button', class: 'btn ghost off', onClick: () => setOn(false) }, 'Desligar o guia')));
    el.replaceChildren(h('div', { class: 'g--topo' }, piu, balao));
  }

  function openGlossary(termId, opener) {
    const previous = opener ?? document.activeElement;
    const search = h('input', { type: 'search', class: 'line', placeholder: 'Buscar termo (pt ou en)', 'aria-label': 'Buscar no glossário', autocomplete: 'off' });
    const list = h('dl', {});
    const close = h('button', { type: 'button', class: 'btn ghost' }, 'Fechar');
    const box = h('div', { class: 'card hero glos', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'glos-title' },
      h('h2', { id: 'glos-title' }, 'Glossário'),
      h('div', { class: 'body' }, search, list, h('div', { class: 'actions' }, close)));
    const overlay = h('div', { class: 'modal' }, box);

    const fill = (focusId) => {
      const found = searchTerms(search.value);
      list.replaceChildren(...(found.length
        ? found.flatMap((t) => [
          h('dt', { id: `glos-${t.id}`, class: t.id === focusId ? 'on' : '' }, t.pt, h('i', {}, t.en)),
          h('dd', {}, t.curto, t.pagina ? h('small', {}, ` (livro, p. ${t.pagina})`) : null),
        ])
        : [h('dd', {}, 'Nenhum termo encontrado.')]));
      if (focusId) list.querySelector(`#glos-${focusId}`)?.scrollIntoView({ block: 'center' });
    };
    const finish = () => {
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      previous?.focus?.();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(); return; }
      if (e.key === 'Tab') {
        const order = [search, close];
        const i = order.indexOf(document.activeElement);
        e.preventDefault();
        order[i < 0 ? 0 : (i + (e.shiftKey ? order.length - 1 : 1)) % order.length].focus();
      }
    };
    search.addEventListener('input', () => fill(null));
    close.addEventListener('click', finish);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) finish(); });
    document.addEventListener('keydown', onKey, true);
    fill(termId && findTerm(termId) ? termId : null);
    document.body.append(overlay);
    (termId ? close : search).focus();
  }

  paint();
  return {
    el,
    toggle,
    update(id) { slideId = id; paint(); },
    link,
    isOn: () => prefs.on,
    terms: GLOSSARY,
  };
}
