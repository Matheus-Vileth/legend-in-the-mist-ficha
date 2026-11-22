// Conteúdo do guia (parafraseado do livro; páginas = numeração impressa).
// Term: { id, pt, en, curto, pagina?, apelidos? }  |  TIPS: id do passo -> dicas

export const GLOSSARY = [
  { id: 'heroi', pt: 'Herói', en: 'Hero', curto: 'O personagem que você interpreta. Ele é descrito por quatro temas, uma Companhia, uma Mochila e uma Promessa.', apelidos: ['heróis', 'personagem'] },
  { id: 'tema', pt: 'Tema', en: 'Theme', curto: 'Um conjunto de tags sobre um mesmo aspecto do herói (quem ele é, de onde vem, o que faz). Todo herói tem quatro.', pagina: 74, apelidos: ['temas'] },
  { id: 'magnitude', pt: 'Magnitude', en: 'Might', curto: 'O tamanho do tema: Origem (comum), Aventura (notável) ou Grandeza (incrível). As tags devem combinar com ela.', pagina: 171 },
  { id: 'origem', pt: 'Origem', en: 'Origin', curto: 'Magnitude do que é comum e cotidiano, o ponto de partida do herói.', pagina: 171 },
  { id: 'aventura', pt: 'Aventura', en: 'Adventure', curto: 'Magnitude do que é notável: feitos e talentos que se destacam da multidão.', pagina: 171 },
  { id: 'grandeza', pt: 'Grandeza', en: 'Greatness', curto: 'Magnitude do que é incrível, lendário, capaz de mudar o mundo.', pagina: 171 },
  { id: 'tipo-de-tema', pt: 'Tipo de tema', en: 'Themebook', curto: 'A categoria do tema, que traz sugestões de tags, buscas e melhorias especiais para ele.', pagina: 79, apelidos: ['tipos de tema'] },
  { id: 'tag', pt: 'Tag', en: 'Tag', curto: 'Uma palavra ou frase curta que descreve algo sobre o herói. Pode ser de poder ou de fraqueza.', pagina: 76, apelidos: ['tags'] },
  { id: 'tag-de-poder', pt: 'Tag de poder', en: 'Power tag', curto: 'Uma tag que ajuda o herói: algo que ele sabe, tem ou é. A primeira de cada tema é o título do tema.', pagina: 76, apelidos: ['tags de poder'] },
  { id: 'tag-de-fraqueza', pt: 'Tag de fraqueza', en: 'Weakness tag', curto: 'Uma tag que complica a vida do herói. Quando usada contra ele, marca a trilha de melhoria do tema.', pagina: 76, apelidos: ['tags de fraqueza'] },
  { id: 'titulo-do-tema', pt: 'Título do tema', en: 'Theme title', curto: 'A tag de poder principal do tema: o nome pelo qual ele é conhecido.', apelidos: ['título'] },
  { id: 'busca', pt: 'Busca', en: 'Quest', curto: 'O que move o tema do herói: um desejo, uma verdade, um lar ou uma pergunta a resolver.', pagina: 188, apelidos: ['buscas'] },
  { id: 'marco', pt: 'Marco', en: 'Milestone', curto: 'Um passo no caminho do tema. Ao chegar ao terceiro marco, o tema evolui.', pagina: 187, apelidos: ['marcos'] },
  { id: 'abandonar', pt: 'Abandonar', en: 'Abandon', curto: 'Deixar um tema para trás por escolha da história. No terceiro abandono, o tema é substituído.', pagina: 75, apelidos: ['abandono', 'abandonos'] },
  { id: 'melhoria', pt: 'Melhoria', en: 'Improve', curto: 'Quando a trilha enche (3 marcas), o tema melhora: em geral uma nova tag de poder.', pagina: 187, apelidos: ['melhorias'] },
  { id: 'melhoria-especial', pt: 'Melhoria especial', en: 'Special improvement', curto: 'Uma vantagem extra, própria do tipo de tema, anotada nas linhas de melhorias especiais.', apelidos: ['melhorias especiais'] },
  { id: 'companhia', pt: 'Companhia', en: 'Fellowship', curto: 'O grupo de heróis como um todo, com suas relações entre si.', pagina: 138 },
  { id: 'relacao', pt: 'Relação', en: 'Relationship', curto: 'O laço de um herói com outro da Companhia, descrito por uma tag.', pagina: 138, apelidos: ['relações', 'tag de relação', 'tags de relação'] },
  { id: 'mochila', pt: 'Mochila', en: 'Backpack', curto: 'Onde o herói guarda seus itens e recursos, cada um descrito por uma tag.', pagina: 76 },
  { id: 'quintessencia', pt: 'Quintessência', en: 'Quintessence', curto: 'Uma energia especial do mundo do jogo, ligada a certos temas e poderes.', apelidos: ['quintessências'] },
  { id: 'promessa', pt: 'Promessa', en: 'Promise', curto: 'Um compromisso do herói. Ao preencher os 5 círculos, ele vive um Momento de Realização.', pagina: 193, apelidos: ['promessas'] },
  { id: 'momento-de-realizacao', pt: 'Momento de Realização', en: 'Fulfillment moment', curto: 'O ponto alto da Promessa: o herói escolhe entre 6 recompensas e seu caminho avança.', pagina: 193, apelidos: ['momentos de realização'] },
  { id: 'narrador', pt: 'Narrador', en: 'Narrator', curto: 'Quem conduz o jogo, descreve o mundo e interpreta as ameaças.', apelidos: ['narradora'] },
  { id: 'poder', pt: 'Poder', en: 'Power', curto: 'Soma das tags de poder usadas numa rolagem, que define o quanto a ação rende.', pagina: 152 },
  { id: 'riscar', pt: 'Riscar', en: 'Scratch', curto: 'Marcar uma tag como gasta: ela deixa de servir até ser recuperada, por exemplo ao acampar.', pagina: 76, apelidos: ['riscada', 'riscadas', 'riscado', 'riscados'] },
  { id: 'queimar-tag', pt: 'Queimar uma tag', en: 'Burn a tag', curto: 'Gastar uma tag de vez para um efeito maior: ela vale 3 de Poder na rolagem.', pagina: 158, apelidos: ['queimar tag', 'queimar'] },
  { id: 'tag-de-historia', pt: 'Tag de história', en: 'Story tag', curto: 'Uma tag da cena ou do mundo (não do herói) que ajuda ou atrapalha quem a usa.', pagina: 164, apelidos: ['tags de história'] },
  { id: 'estado', pt: 'Estado', en: 'Status', curto: 'Efeito temporário numa pessoa ou cena, com nível de 1 a 6 (o limite que vale é 5).', pagina: 166, apelidos: ['estados'] },
  { id: 'nivel', pt: 'Nível', en: 'Tier', curto: 'A intensidade de um estado, de 1 a 6.', pagina: 166, apelidos: ['níveis'] },
  { id: 'acampar', pt: 'Acampar', en: 'Make camp', curto: 'Pausa para descansar: o grupo se recupera e conversa antes da próxima etapa.', pagina: 179 },
  { id: 'ameaca', pt: 'Ameaça', en: 'Threat', curto: 'Um perigo do mundo, controlado pelo Narrador, que se opõe aos heróis.', pagina: 147, apelidos: ['ameaças'] },
  { id: 'consequencia', pt: 'Consequência', en: 'Consequence', curto: 'O que acontece de ruim quando a ação não sai como o herói queria.', pagina: 160, apelidos: ['consequências'] },
];

export const TIPS = {
  identidade: [
    'Aqui você dá nome ao herói e define quem ele é. Nada é definitivo: dá para voltar e mudar depois.',
    'Pense em uma frase que resume o herói. Ela guia as tags dos temas que vêm a seguir.',
  ],
  tema1: [
    'Um tema é um aspecto do herói. Você terá quatro. Comece pelo título: a primeira tag de poder.',
    'Escolha a Magnitude: Origem é comum, Aventura é notável, Grandeza é incrível.',
    'Anote a Busca do tema: o que move o herói nesse aspecto.',
  ],
  tema2: [
    'Cada tema cobre uma faceta diferente: evite repetir o que já escreveu no primeiro.',
    'Combine as tags de poder com a Magnitude escolhida. Uma tag de fraqueza dá sabor e rende melhorias.',
  ],
  tema3: [
    'Varie os tipos de tema para um herói completo: o que ele faz, de onde vem, o que carrega.',
    'Dúvida sobre o tipo de tema? Ele traz sugestões de tags e de buscas.',
  ],
  tema4: [
    'O último tema fecha o quadro do herói. Pode ser algo inesperado que o torne único.',
    'Lembre: ao chegar ao terceiro marco, um tema evolui; no terceiro abandono, é substituído.',
  ],
  companhia: [
    'A Companhia é o grupo. Aqui você escreve a relação do herói com cada um dos outros.',
    'Cada relação é uma tag curta: pode ajudar na hora de agir junto, ou complicar.',
  ],
  mochila: [
    'A Mochila guarda os itens do herói. Cada item é uma tag.',
    'Itens riscados ficam gastos até serem recuperados. Escreva só o que o herói realmente leva.',
  ],
  estados: [
    'Estados são efeitos temporários, com nível de 1 a 6. Anote aqui os que estão ativos no herói.',
    'O limite que vale na maioria dos casos é 5. Quando o estado passa, é só apagar.',
  ],
  promessa: [
    'A Promessa é o compromisso do herói. Preencher os 5 círculos leva a um Momento de Realização.',
    'Escreva uma promessa que dê vontade de cumprir e que renda boas cenas.',
  ],
  revisao: [
    'Confira nomes, tags e magnitudes de cada tema antes de baixar o PDF.',
    'Clique em qualquer passo na lateral para voltar e corrigir. Seu progresso fica salvo neste navegador.',
  ],
};
