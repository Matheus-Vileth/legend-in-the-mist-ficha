# Ficha de Legend in the Mist em carrossel — design

Data: 2026-11-20. Status: aguardando aprovação.

## Intenção
Preencher a ficha de herói de Legend in the Mist passo a passo, num carrossel (um assunto por slide),
com download no final. O usuário joga em português; a interface e as dicas ficam em português.
Uso pessoal e do grupo de jogo, não publicação aberta.

## Metas
- Um slide por etapa, com dica curta tirada do livro (Hero Creation, pp. 77-78).
- Último slide: revisão + baixar o **PDF oficial preenchido** + baixar/abrir **save .json**.
- Funciona offline, abrindo um único `index.html` (sem servidor).
- Progresso salvo sozinho no navegador (localStorage, com try/catch).

## Não-metas
- Redesenhar a ficha (rótulos impressos no PDF continuam em inglês).
- Gerar tags automáticas, tropes ou theme kits (pode vir depois).
- Hospedar publicamente (o PDF é conteúdo da Son of Oak).

## Anti-metas
- Perder o que foi digitado ao recarregar a página.
- PDF baixado com campos desalinhados ou em branco.

## Abordagem escolhida (3 de 3 consideradas)
1. PDF oficial preenchido: escolhida, base do download.
2. Redesenhar a ficha em HTML: descartada (menos fiel, mais trabalho).
3. PDF oficial + save .json: **escolhida** (1 + reabrir/editar depois).

## Slides (≈ 9)
1. Identidade: nome do personagem, nome do jogador.
2-5. Tema 1 a 4: tipo de tema, Magnitude (Origem/Aventura/Grandeza), tags de poder (até 7;
   a 1ª é o título do tema), tags de fraqueza (até 2), Busca (+ marcos/abandono/melhorias
   como checkboxes), melhorias especiais.
6. Companhia: relações (5), companheiros (5), tags (8), fraquezas (2), Busca da Companhia.
7. Mochila e Quintessências: tags de mochila (5), quintessências (4).
8. Promessa, História e Notas: 5 círculos de Promessa, história, notas.
9. Revisão e Download.

Mapeamento slide → campos do PDF: pelos nomes dos 324 campos (ex.: `Theme Card 0 Power Tag 0`,
`Fellowship 3`, `Promise 2`). Campos de checkbox usam o estado `/Yes`.

## Tradução dos termos (interface)
| Inglês | Português |
|---|---|
| Hero | Herói |
| Theme / Theme type / Themebook | Tema / Tipo de tema / Livro de tema |
| Might | Magnitude |
| Origin / Adventure / Greatness | Origem / Aventura / Grandeza |
| Power tag / Weakness tag / Tag | Tag de poder / Tag de fraqueza / Tag |
| Quest | Busca |
| Milestone / Abandon / Improve | Marco / Abandonar / Melhoria |
| Fellowship | Companhia |
| Relationship / Companion | Relação / Companheiro |
| Backpack | Mochila |
| Quintessence | Quintessência |
| Promise | Promessa |
| Scratched / Tier | Riscada / Nível |
| History / Notes | História / Notas |
| Special improvements | Melhorias especiais |
| Narrator | Narrador |
Tipos de tema: Circunstância, Devoção, Passado, Povo, Personalidade, Habilidade ou Ofício,
Característica (Origem); Dever, Influência, Conhecimento, Habilidade Prodigiosa, Relíquia,
Ser Sobrenatural (Aventura); Destino, Domínio, Maestria, Monstruosidade (Grandeza);
Companheiro, Magia, Posses (variam).

## Decisões do construtor (minhas, a revisar)
- Texto digitado vai para o PDF como foi escrito (português); os rótulos impressos ficam em inglês.
- `pdf-lib` embutido no HTML (offline); PDF oficial embutido em base64 (~3,4 MB).
- Visual: tema sóbrio de fantasia (pergaminho/escuro), responsivo, navegação por setas,
  pontos de progresso e teclado.
- Projeto em `D:\Projetos_Ativos\legend-in-the-mist-ficha`.
- Save .json guarda só os valores dos campos.

## Riscos
- Fonte/tamanho do texto nos campos do PDF: precisa testar com textos longos e acentos.
- Campos duplicados/incoerentes no PDF (ex.: `Theme Card 0  Power Tag 3` com dois espaços,
  `Greatness1`): tratar pelo nome exato.
