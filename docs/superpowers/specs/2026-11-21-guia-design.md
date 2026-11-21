# Guia do jogo (mascote e balão) — design

Data: 2026-11-21. Status: aguardando aprovação.

## Intenção e por quê
Quem nunca jogou Legend in the Mist esbarra em palavras novas (Might, tags, Quest, Fellowship, Scratch, Status...) ao preencher a ficha. O guia
ensina as regras de criação e os termos no próprio site, no passo em que a pessoa está, em português e com o termo original em inglês
(a ficha em PDF e o livro estão em inglês; o site usa traduções). Funciona offline, sem IA e sem enviar nada a ninguém.

## Metas
- Um mascote (o passarinho do conjunto de imagens, nome proposto: **Piu**) com um balão de **2 a 3 dicas curtas por passo**.
- **Glossário** (~30 termos): termo em português, original em inglês, explicação curta, página do livro. Abre pelo balão e pelos termos
  sublinhados nos textos; tem busca.
- **Interruptor Guia ligado/desligado** na barra do topo. A escolha é lembrada no navegador; na primeira visita o guia começa ligado.
  Desligado: mascote, balão, glossário e sublinhados somem.
- O balão pode ser recolhido (só o mascote fica) e a escolha é lembrada.
- Textos do livro **parafraseados** em português (sem copiar trechos), com a página impressa do livro quando eu a tiver verificado.

## Não-metas
- Conversa livre ou IA (decidido com o usuário: guia com roteiro).
- Tour que destaca campos, voz, vídeo, ou editor de conteúdo.
- Traduzir o PDF (os rótulos impressos continuam em inglês).

## Anti-metas (seria falha mesmo que "funcione")
- Tapar campos ou o botão Próximo, principalmente no celular.
- Dizer uma regra errada ou desatualizada para o passo.
- Atrapalhar quem não quer: precisa desligar de verdade e lembrar.
- Quebrar a ficha se o `localStorage` estiver bloqueado.

## Restrições
- Arquivo único e offline; sem rede; sem dependência nova; português do Brasil.
- Acessível: região com nome, interruptor com `aria-pressed`, balão e glossário operáveis por teclado, Esc fecha o glossário, foco visível;
  sem anúncio automático a cada troca de passo; respeita `prefers-reduced-motion`.
- Preferências do guia em chave própria (`lim-guia-v1`), separada da ficha: apagar o personagem não religa nem desliga o guia.
- Usa as imagens já embutidas (`passaro`, `faixa-clara`); o estilo segue o pergaminho atual.

## Abordagem (escolhida pelo usuário: 1 de 3)
Mascote e balão. Descartadas: painel lateral fixo (tira largura dos formulários e é ruim no celular) e dicas só dentro dos cartões
(o "bot" some e o passar do mouse não existe em tela de toque).

## Arquitetura
- `src/guide-data.js`: **dados** — dicas por passo (chave = id do slide) e o glossário (`{ id, pt, en, curto, pagina? }`). É onde o conteúdo vive.
- `src/guide.js`: **funções puras e testáveis** — dicas de um passo, busca de termo, filtro do glossário (sem acento), quebra de um texto em
  trechos com termos (`linkTerms`), leitura e gravação das preferências (`lim-guia-v1`) com `storage` injetado.
- `src/guide-ui.js`: DOM — mascote, balão, glossário (diálogo), termos sublinhados.
- `src/app.js`: monta o interruptor na barra do topo, chama o guia a cada troca de passo.
- Os textos de dica da ficha (`hint` de cada passo) passam por `linkTerms` quando o guia está ligado.

## Comportamento
- Primeira visita: guia ligado e balão aberto no passo 1. Depois, vale o que a pessoa escolheu.
- Trocar de passo atualiza as dicas (sem animação obrigatória). Clicar no mascote recolhe ou abre o balão.
- Botão **Glossário** no balão abre o diálogo; clicar num termo sublinhado abre o glossário já nele.
- Interruptor desligado: tudo some e os textos voltam a ser simples. Religar traz de volta no passo atual.
- Celular (< 860 px): mascote pequeno acima da barra inferior; o balão vira uma folha acima da barra, sem cobrir o Próximo; o glossário ocupa a tela.

## Posição (a decidir no mockup)
Padrão: canto inferior esquerdo da área central, acima da barra de botões, `position: fixed`. O mockup compara com o canto inferior direito
(que divide espaço com o rótulo do passo e o Próximo) antes de eu implementar.

## Testes e verificação
- Automatizados (`node --test`): todo passo tem 2 a 3 dicas curtas; cada termo tem pt, en e explicação curta; ids únicos; todo termo citado
  em dica existe; `linkTerms` reconstrói o texto original; busca sem acento; preferências com `localStorage` que lança.
- No navegador: interruptor liga e desliga de verdade e lembra ao recarregar; o glossário abre pelo teclado e por termo; nenhuma dica cobre
  o Próximo no celular; `prefers-reduced-motion`.

## Decisões minhas (conferir)
- Nome **Piu** e o passarinho como mascote; balão em lista de pontos (sem paginação).
- Interruptor no topo, preferência em chave própria, guia começa ligado.
- Conteúdo: ~30 termos, 2 a 3 dicas por passo, escritos por mim a partir do livro e parafraseados; as páginas só entram se eu conferir.
- Termos sublinhados só nos `hint` e nas dicas (não nos títulos dos cartões nem nos rótulos dos campos).
- Sem o guia, o glossário também fica indisponível.

## O que fica para quem implementa
Texto exato de cada dica e definição; tamanhos e animação do mascote; casca visual do balão (faixa clara) e do diálogo.
