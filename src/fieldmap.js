// Mapa slide -> campos do PDF oficial (chave = nome exato do campo no PDF).
//
// Irregularidades do PDF, resolvidas por posição (ver assets/fields.json):
//  - "Tag N / Tag N Tier / Tag N Note" = painel "Current Statuses" (6 níveis, 3 linhas de nota).
//  - 2ª fraqueza do Tema 2 chama-se 'Theme Card 0 Weakness Tag 3'.
//  - 'Theme Card N  Power Tag 3' tem DOIS espaços. Tema 3 usa 'Theme Card 2 Greatness1'.
//  - Riscadas ("Scratched"): Tema 3 usa 'Theme Card 3 Scratched 4' na 5ª linha;
//    Tema 4 usa a ordem [1,7,2,3,0,5,6] (linha de cima para baixo).
//  - Special Improvements, History e Notes ficam na 2ª página do PDF.

export const THEME_TYPES = {
  Origem: ['Circunstância', 'Devoção', 'Passado', 'Povo', 'Personalidade', 'Habilidade ou Ofício', 'Característica'],
  Aventura: ['Dever', 'Influência', 'Conhecimento', 'Habilidade Prodigiosa', 'Relíquia', 'Ser Sobrenatural'],
  Grandeza: ['Destino', 'Domínio', 'Maestria', 'Monstruosidade'],
  Variam: ['Companheiro', 'Magia', 'Posses'],
};

/** Campos do PDF deliberadamente não expostos. Hoje todos são mapeados. */
export const IGNORED_FIELDS = [];

const range = (n) => Array.from({ length: n }, (_, i) => i);
const text = (name, label, extra = {}) => ({ name, kind: 'text', label, ...extra });
const check = (name, label, extra = {}) => ({ name, kind: 'check', label, ...extra });

function scratchName(card, row) {
  if (card === 2 && row === 4) return 'Theme Card 3 Scratched 4';
  if (card === 3) return `Theme Card 3 Scratched ${[1, 7, 2, 3, 0, 5, 6][row]}`;
  return `Theme Card ${card} Scratched ${row}`;
}

const powerName = (card, i) => (i === 3 ? `Theme Card ${card}  Power Tag 3` : `Theme Card ${card} Power Tag ${i}`);
const weaknessName = (card, i) =>
  card === 1 && i === 1 ? 'Theme Card 0 Weakness Tag 3' : `Theme Card ${card} Weakness Tag ${i}`;
const greatnessName = (card) => (card === 2 ? 'Theme Card 2 Greatness1' : `Theme Card ${card} Greatness`);

/** Três linhas de Busca + marcos/abandono/melhorias. `prefix` = 'Theme 0' ou 'Fellowship'. */
function questGroups(prefix, questLines) {
  const trio = (kind, label) =>
    range(3).map((j) => check(`${prefix} Quest ${kind} ${j}`, `${label} ${j + 1}`));
  return [
    { label: 'Busca', fields: questLines.map((n, j) => text(n, `Busca — linha ${j + 1}`)) },
    { label: 'Marcos', fields: trio('Milestone', 'Marco') },
    { label: 'Abandonar', fields: trio('Abandon', 'Abandono') },
    { label: 'Melhoria', fields: trio('Improve', 'Melhoria') },
  ];
}

function themeSlide(card) {
  const n = card + 1;
  const powers = range(7).flatMap((i) => [
    text(powerName(card, i), i === 0 ? 'Título do tema (1ª tag de poder)' : `Tag de poder ${i + 1}`, { role: `power${i}` }),
    check(scratchName(card, i), 'riscada', { role: `scratch${i}` }),
  ]);
  return {
    id: `tema${n}`,
    section: 'temas',
    title: `Tema ${n}`,
    hint:
      'Escolha o tipo e a Magnitude. A 1ª tag de poder é o título do tema e deve combinar com a Magnitude ' +
      '(Origem: comum; Aventura: acima do comum; Grandeza: grandioso). Tags de poder devem ser úteis; a de fraqueza deve limitar. ' +
      'A Busca pode ser um Desejo, uma Verdade, um Lar ou uma Pergunta.',
    groups: [
      { label: 'Título do tema', fields: powers.slice(0, 2) },
      { label: 'Tipo de tema', fields: [text(`Theme Card ${card} Type`, 'Tipo de tema', { options: Object.values(THEME_TYPES).flat() })] },
      {
        label: 'Magnitude',
        exclusive: true,
        fields: [
          check(`Theme Card ${card} Origin`, 'Origem'),
          check(`Theme Card ${card} Adventure`, 'Aventura'),
          check(greatnessName(card), 'Grandeza'),
        ],
      },
      { label: 'Tags de poder', fields: powers.slice(2) },
      { label: 'Tags de fraqueza', fields: range(2).map((i) => text(weaknessName(card, i), `Tag de fraqueza ${i + 1}`)) },
      ...questGroups(`Theme ${card}`, range(3).map((j) => `Theme ${card} Quest ${j}`)),
      {
        label: 'Melhorias especiais',
        fields: range(13).map((j) => text(`Theme Card ${card} Special Improvements ${j}`, `Melhoria especial ${j + 1}`)),
      },
    ],
  };
}

export const SLIDES = [
  {
    id: 'identidade',
    section: 'personagem',
    title: 'Identidade',
    hint: 'Quem é o seu herói e quem joga com ele.',
    groups: [
      { label: 'Nome do personagem', fields: [text('Character Name', 'Nome do personagem')] },
      { label: 'Nome do jogador', fields: [text('Player Name', 'Nome do jogador')] },
    ],
  },
  themeSlide(0),
  themeSlide(1),
  themeSlide(2),
  themeSlide(3),
  {
    id: 'companhia',
    section: 'detalhes',
    title: 'Companhia',
    hint:
      'A Companhia é o grupo. Anote cada companheiro e a tag da relação do seu herói com ele. ' +
      'As tags da Companhia seguem a mesma regra dos temas: úteis de poder, limitantes de fraqueza.',
    groups: [
      {
        label: 'Relações',
        fields: range(5).flatMap((i) => [
          text(`Companion ${i}`, `Companheiro ${i + 1}`),
          text(`Relationship ${i}`, `Tag de relação ${i + 1}`),
        ]),
      },
      {
        label: 'Tags da Companhia',
        fields: range(8).flatMap((i) => [text(`Fellowship ${i}`, `Tag ${i + 1}`), check(`Fellowship Scratched ${i}`, 'riscada')]),
      },
      { label: 'Tags de fraqueza', fields: range(2).map((i) => text(`Fellowship Weakness ${i}`, `Tag de fraqueza ${i + 1}`)) },
      ...questGroups('Fellowship', range(3).map((j) => `Fellowship Quest ${j}`)),
      {
        label: 'Melhorias especiais',
        fields: range(15).map((j) => text(`Fellowship Special Improvements ${j}`, `Melhoria especial ${j + 1}`)),
      },
    ],
  },
  {
    id: 'mochila',
    section: 'detalhes',
    title: 'Mochila e Quintessências',
    hint:
      'Escolha uma tag de mochila (um item que o herói carrega; veja a Loja Geral do livro, p. 132). ' +
      'Quintessências são as essências mágicas que o herói reuniu.',
    groups: [
      { label: 'Tags de mochila', fields: range(5).map((i) => text(`Backpack Tags ${i}`, `Tag de mochila ${i + 1}`)) },
      { label: 'Quintessências', fields: range(4).map((i) => text(`Quintessences ${i}`, `Quintessência ${i + 1}`)) },
    ],
  },
  {
    id: 'estados',
    section: 'detalhes',
    title: 'Estados atuais',
    hint: 'Estados que afetam o herói agora. Marque o nível (1 a 6) de cada um. Pode deixar em branco ao criar o herói.',
    groups: [
      ...range(4).map((i) => ({
        label: `Estado ${i + 1}`,
        fields: [
          text(`Tag ${i}`, 'Nome do estado'),
          ...range(6).map((t) => check(`Tag ${i} Tier ${t}`, `Nível ${t + 1}`)),
          ...range(3).map((j) => text(`Tag ${i} Note ${j}`, `Nota ${j + 1}`, { fold: true })),
        ],
      })),
      { label: 'Notas adicionais', fields: range(2).map((i) => text(`Tag Additional Notes ${i}`, `Nota adicional ${i + 1}`)) },
    ],
  },
  {
    id: 'promessa',
    section: 'detalhes',
    title: 'Promessa, História e Notas',
    hint:
      'A Promessa tem 5 círculos que se marcam ao longo do jogo. Em História, escreva o passado do herói em poucas linhas; em Notas, o que quiser lembrar.',
    groups: [
      { label: 'Promessa', fields: range(5).map((i) => check(`Promise ${i}`, `Círculo ${i + 1}`)) },
      { label: 'História', fields: range(8).map((i) => text(`History ${i}`, `Linha ${i + 1}`)) },
      { label: 'Notas', fields: range(23).map((i) => text(`Notes ${i}`, `Linha ${i + 1}`)) },
    ],
  },
];

export function allMappedNames() {
  return SLIDES.flatMap((s) => s.groups.flatMap((g) => g.fields.map((f) => f.name)));
}
