// Tela inicial: sem personagem salvo (criar) ou com personagem salvo (continuar).
import { homeSummary, hasSaved, savedAgo } from './state.js';
import { h, img } from './ui.js';

function themesText(themes) {
  if (themes.length === 0) return 'Nenhum tema preenchido ainda';
  const rest = themes.length - 2;
  return themes.slice(0, 2).join(' · ') + (rest > 0 ? ` · +${rest} ${rest === 1 ? 'tema' : 'temas'}` : '');
}

/** ctx = { getState(), getSavedAt(), onNew(), onResume(), onDelete(), onOpenFile(file) } — devolve a lista de nós da tela. */
export function renderHome(ctx) {
  const state = ctx.getState();
  const saved = hasSaved(state);
  const sum = homeSummary(state);
  const ago = savedAgo(ctx.getSavedAt(), Date.now());
  const fileInput = h('input', {
    type: 'file', accept: '.json,application/json', hidden: true,
    onChange: (e) => { const file = e.target.files[0]; e.target.value = ''; if (file) ctx.onOpenFile(file); },
  });

  const resume = h('section', { class: 'sub resume', 'aria-label': 'Personagem salvo neste navegador' },
    h('h3', {}, 'Continuar de onde parou'),
    h('div', { class: 'who' }, img('ornamento-folha-a'),
      h('div', {}, h('b', {}, sum.name || '(sem nome)'), h('span', {}, themesText(sum.themes)))),
    h('div', { class: 'pbar' }, ...Array.from({ length: sum.total }, (_, k) => h('i', { class: k < sum.step ? 'on' : '' }))),
    h('div', { class: 'small' }, h('span', {}, `Passo ${sum.step} de ${sum.total}`), h('span', {}, ago ? `Salvo ${ago}` : '')),
    h('div', { class: 'rowbtns' },
      h('button', { type: 'button', class: 'btn primary', onClick: ctx.onResume }, 'Continuar →'),
      h('button', { type: 'button', class: 'btn ghost', title: 'Apagar este personagem', 'aria-label': 'Apagar este personagem', onClick: ctx.onDelete },
        img('botao-lixeira', { style: 'width:26px;filter:none' }))));

  const actions = h('div', { class: 'home-actions' },
    saved ? resume : h('button', { type: 'button', class: 'btn primary', onClick: ctx.onNew }, img('ic-mais', { style: 'width:24px' }), 'Criar novo herói'),
    h('div', { class: saved ? 'home-secondary' : 'home-secondary single' },
      saved ? h('button', { type: 'button', class: 'btn ghost', onClick: ctx.onNew }, img('ic-mais'), 'Novo herói') : null,
      h('button', { type: 'button', class: 'btn ghost', onClick: () => fileInput.click() }, img('ic-livro'), 'Abrir save (.json)'),
      fileInput),
    h('div', { id: 'home-status', class: 'aviso', role: 'status', hidden: true }));

  return [
    img('espada-flores', { class: 'deco d-espada', style: 'left:3%;bottom:0;width:150px' }),
    img('flores-grandes', { class: 'deco d-flores', style: 'right:4%;bottom:0;width:190px' }),
    img('flores-azuis', { class: 'deco d-azuis', style: 'right:17%;bottom:0;width:120px' }),
    img('passaro', { class: 'deco d-passaro', style: 'right:5%;bottom:190px;width:96px' }),
    img('borboleta', { class: 'deco d-borboleta', style: 'left:17%;top:16%;width:54px' }),
    img('logo', { class: 'home-logo', alt: 'Legend in the Mist' }),
    img('divisor-a', { style: 'width:300px;max-width:80%' }),
    h('h1', {}, 'Ficha de Herói'),
    h('p', { class: 'tagline' }, 'Crie o seu herói passo a passo e baixe a ficha oficial em PDF, pronta para a mesa.'),
    actions,
    h('div', { class: 'how', 'aria-label': 'Como funciona' },
      h('div', {}, img('icone-estrela'), h('b', {}, '10 passos'), h('span', {}, 'Temas, Companhia, Mochila e mais, um assunto por vez.')),
      h('div', {}, img('icone-livro'), h('b', {}, 'Salvo sozinho'), h('span', {}, 'O progresso fica neste navegador. Baixe o save para guardar.')),
      h('div', {}, img('icone-coroa'), h('b', {}, 'PDF oficial'), h('span', {}, 'No fim, baixe a ficha oficial já preenchida.'))),
    h('p', { class: 'home-foot' }, 'Ficha não oficial feita por fãs. Legend in the Mist é de Son of Oak Game Studio.'),
  ];
}
