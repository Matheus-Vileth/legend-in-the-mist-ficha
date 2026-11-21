// O que cada passo mostra, descrito por dados. Os grupos são citados pelo rótulo (ver fieldmap.js);
// cada grupo de cada slide aparece exatamente uma vez (garantido por test/layouts.test.mjs).
//
// Block:
//   hero    cartão de foco (faixa marrom no topo); `split` = ribbon à esquerda, o resto à direita
//   card    cartão com faixa marrom; `emphasis` = com destaque (sombra maior)
//   sub     bloco leve, sem faixa marrom; `tone: 'weak'` = título em vinho (tags de fraqueza)
//   details bloco recolhível (opcional)
//   cols    colunas (`ratio` = grid-template-columns)
//   grid    grade de 2 colunas iguais

const RATIO = '3fr 2fr';
const QUEST_GROUPS = ['Busca', 'Abandonar', 'Melhoria', 'Marcos'];

function themeLayout() {
  return {
    blocks: [
      { kind: 'hero', title: 'Identidade do tema', split: true, groups: ['Título do tema', 'Tipo de tema', 'Magnitude'] },
      {
        kind: 'cols',
        ratio: RATIO,
        cols: [
          [{ kind: 'card', title: 'Tags de poder', groups: ['Tags de poder'] }],
          [
            { kind: 'sub', title: 'Tags de fraqueza', tone: 'weak', groups: ['Tags de fraqueza'] },
            { kind: 'sub', title: 'Busca', groups: QUEST_GROUPS },
          ],
        ],
      },
      { kind: 'details', title: 'Melhorias especiais', groups: ['Melhorias especiais'] },
    ],
  };
}

export const LAYOUTS = {
  identidade: {
    decor: 'paisagem',
    blocks: [
      { kind: 'hero', title: 'Nome do personagem', groups: ['Nome do personagem'] },
      { kind: 'sub', title: 'Nome do jogador', groups: ['Nome do jogador'] },
    ],
  },
  tema1: themeLayout(),
  tema2: themeLayout(),
  tema3: themeLayout(),
  tema4: themeLayout(),
  companhia: {
    blocks: [
      {
        kind: 'cols',
        ratio: RATIO,
        cols: [
          [{ kind: 'card', title: 'Relações', emphasis: true, groups: ['Relações'] }],
          [
            { kind: 'sub', title: 'Tags da Companhia', groups: ['Tags da Companhia'] },
            { kind: 'sub', title: 'Tags de fraqueza', tone: 'weak', groups: ['Tags de fraqueza'] },
            { kind: 'sub', title: 'Busca', groups: QUEST_GROUPS },
          ],
        ],
      },
      { kind: 'details', title: 'Melhorias especiais', groups: ['Melhorias especiais'] },
    ],
  },
  mochila: {
    blocks: [
      {
        kind: 'cols',
        ratio: RATIO,
        cols: [
          [{ kind: 'card', title: 'Tags de mochila', emphasis: true, groups: ['Tags de mochila'] }],
          [{ kind: 'sub', title: 'Quintessências', groups: ['Quintessências'] }],
        ],
      },
    ],
  },
  estados: {
    blocks: [
      {
        kind: 'grid',
        blocks: [1, 2, 3, 4].map((n) => ({ kind: 'card', title: `Estado ${n}`, groups: [`Estado ${n}`] })),
      },
      { kind: 'sub', title: 'Notas adicionais', groups: ['Notas adicionais'] },
    ],
  },
  promessa: {
    blocks: [
      { kind: 'card', title: 'Promessa', emphasis: true, groups: ['Promessa'] },
      {
        kind: 'cols',
        ratio: RATIO,
        cols: [
          [{ kind: 'card', title: 'História', groups: ['História'] }],
          [{ kind: 'details', title: 'Notas', groups: ['Notas'] }],
        ],
      },
    ],
  },
};
