// Último passo: resumo, download do PDF e do save.
import { themeCards } from './state.js';
import { MIGHT_ICON } from './steps.js';
import { h, img } from './ui.js';

/** ctx = { getState(), onPdf(), onJson(), onImport(file) } */
export function renderReview(ctx) {
  const state = ctx.getState();
  const fileInput = h('input', {
    type: 'file', accept: '.json,application/json', hidden: true,
    onChange: (e) => { const file = e.target.files[0]; e.target.value = ''; if (file) ctx.onImport(file); },
  });
  const cards = themeCards(state).map((c) =>
    h('section', { class: 'sub' },
      h('h3', {}, `Tema ${c.n}${c.might ? ` · ${c.might}` : ''}`),
      h('div', { class: 'sum' },
        img(MIGHT_ICON[c.might] ?? 'ornamento-folha-a'),
        h('div', {},
          h('b', {}, c.title || '(sem título)'),
          h('span', {}, [c.type, `${c.tags} ${c.tags === 1 ? 'tag' : 'tags'} de poder`].filter(Boolean).join(' · '))))));
  return h('div', { class: 'view' },
    h('h1', { tabIndex: -1 }, 'Revisão e download'),
    img('divisor-b', { class: 'divider' }),
    h('p', { class: 'hint' }, 'Confira o resumo. O PDF baixado é a ficha oficial preenchida (os rótulos impressos são em inglês; o que você escreveu fica em português). O save (.json) permite reabrir e editar depois.'),
    h('div', { class: 'exports' },
      h('button', { type: 'button', class: 'btn wine primary', onClick: ctx.onPdf }, img('ic-baixar', { style: 'width:24px' }), 'Baixar PDF da ficha'),
      h('button', { type: 'button', class: 'btn ghost', onClick: ctx.onJson }, img('ic-disquete'), 'Baixar save (.json)'),
      h('button', { type: 'button', class: 'btn ghost', onClick: () => fileInput.click() }, img('ic-livro'), 'Abrir save'),
      fileInput),
    h('div', { id: 'status', class: 'aviso', role: 'status', hidden: true }),
    h('div', { class: 'sumgrid' },
      h('section', { class: 'sub' },
        h('h3', {}, 'Personagem'),
        h('div', { class: 'sum' }, img('ornamento-coroa'),
          h('div', {}, h('b', {}, state.values['Character Name'] || '(sem nome)'), h('span', {}, `Jogador: ${state.values['Player Name'] || '—'}`)))),
      ...cards));
}
