# Novo visual (pergaminho) no site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar no site real o visual aprovado em `docs/mockups/design-pergaminho-v6.html`: tela inicial, abas, lateral de passos, telas próprias por passo e imagens em alta resolução embutidas.

**Architecture:** A lógica (campos, estado, PDF) não muda. O que cada passo mostra passa a ser descrito por dados (`src/layouts.js`, testável), e o DOM é gerado a partir deles. As imagens de `assets/ui-hd/` entram embutidas (data URI) num mapa `window.__UI__`, que também vira variáveis CSS `--img-<nome>`.

**Tech Stack:** JavaScript ES modules, Node 24 (`node --test`), `pdf-lib`, `esbuild`. Sem novas dependências.

**Spec:** `docs/mockups/design-pergaminho-v6.html` (fonte visual: CSS, estrutura e textos) + `docs/superpowers/specs/2026-11-20-ficha-carrossel-design.md` (comportamento).

## Global Constraints

- Um único `dist/index.html`, offline: sem CDN e sem `http(s)://` em `src=`/`href=`.
- Imagens só de `assets/ui-hd/` (3× do original). Nada baixado; nenhuma dependência npm nova.
- Fontes: pilha do mockup (`"Cinzel"`, `"Trajan Pro"`, Georgia, serif) sem embutir fontes.
- Interface em português, termos do spec anterior (Magnitude, Busca, Companhia, Mochila, Promessa, Quintessência...).
- Responsivo: abaixo de 860 px a lateral some, as abas rolam na horizontal e as colunas empilham; alvos de toque ≥ 44 px; sem rolagem horizontal.
- Acessível: campos são `<input>` reais; marcas e medalhões são `<input type="checkbox">` com rótulo; foco visível.
- Os 45 testes existentes continuam passando; nada de `localStorage` sem `try/catch`.
- Trabalho na branch `feat/visual` (a partir de `main`); commits terminam com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Apagar o personagem na tela inicial: pede confirmação, só apaga com "sim", e o app volta ao estado vazio.
2. `localStorage` indisponível: a tela inicial mostra "sem personagem" e o app funciona (baixar PDF e save continuam).
3. Save antigo, sem `savedAt`: abre normalmente e a tela inicial mostra o personagem sem erro de data.
4. Magnitude: marcar uma desmarca as outras; clicar de novo na marcada limpa; o valor chega ao PDF.
5. Último passo: o botão Próximo some, o PDF é a ação principal e o aviso mostra sucesso ou erro.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/fieldmap.js` | (alterar) grupos mais finos, `section`, `fold` |
| `src/layouts.js` | (novo) `LAYOUTS`: blocos de cada passo, por rótulo de grupo |
| `src/carousel.js` | (alterar) seções, rótulo do passo, passo concluído |
| `src/state.js` | (alterar) `savedAt`, `hasSaved`, `clearState`, `savedAgo`, `homeSummary` |
| `src/ui.js` | (novo) `h()`, `ui(nome)` (data URI), `applyUiVars()` |
| `src/steps.js` | (novo) desenha um passo a partir de `LAYOUTS` |
| `src/home.js` | (novo) tela inicial |
| `src/app.js` | (reescrever) casca: abas, lateral, rodapé, liga tudo |
| `src/style.css`, `src/index.template.html` | (reescrever) visual do v6 |
| `build.mjs` | (alterar) embute `ui-hd` |

---

### Task 1: Ativos e branch

**Files:** Create: `.gitignore` (já ignora `dist`), adicionar `assets/ui/`, `assets/ui-hd/`, `assets/ui-src/`, `tools/slice-ui.py`, `tools/upscale-ui.py`, `docs/mockups/`.

- [ ] **Step 1:** `git checkout -b feat/visual` a partir de `main`.
- [ ] **Step 2:** `git add` dos arquivos acima; `npm test` verde; commit `chore: ativos de interface, mockups e scripts de recorte/ampliação`.

---

### Task 2: Grupos e seções no mapa de campos

**Files:** Modify: `src/fieldmap.js`; Test: `test/fieldmap.test.mjs` (acrescentar).

**Interfaces:**
- Produces: `Slide.section: 'personagem'|'temas'|'detalhes'` (as 9 slides de edição); `Field.fold?: boolean`.
  Rótulos de grupo, únicos por slide: `identidade` → `Nome do personagem`, `Nome do jogador`; cada `temaN` → `Título do tema` (power0 + scratch0), `Tipo de tema`, `Magnitude`, `Tags de poder` (power1..6 + riscadas), `Tags de fraqueza`, `Busca`, `Marcos`, `Abandonar`, `Melhoria`, `Melhorias especiais`; `companhia` → `Relações`, `Tags da Companhia`, `Tags de fraqueza`, `Busca`, `Marcos`, `Abandonar`, `Melhoria`, `Melhorias especiais`; `mochila` → `Tags de mochila`, `Quintessências`; `estados` → `Estado 1`..`Estado 4`, `Notas adicionais`; `promessa` → `Promessa`, `História`, `Notas`. Seções: identidade → `personagem`; tema1-4 → `temas`; companhia, mochila, estados, promessa → `detalhes`.
  Em cada `Estado N`, os 3 campos `Tag N Note j` têm `fold: true`.

- [ ] **Step 1: Testes que falham**: `rótulos de grupo por slide são os do plano e únicos`; `cada slide tem section`; `notas dos Estados têm fold e o resto não`; `Título do tema tem exatamente power0 e scratch0`.
- [ ] **Step 2:** `npm test`. Esperado: FAIL.
- [ ] **Step 3:** Implementar a divisão de grupos em `src/fieldmap.js` (nomes de campo e `role` não mudam; os testes antigos continuam valendo).
- [ ] **Step 4:** `npm test`. Esperado: PASS (45 antigos + novos).
- [ ] **Step 5:** Commit `feat: grupos mais finos e seções no mapa de campos`.

---

### Task 3: Layouts dos passos

**Files:** Create: `src/layouts.js`, `test/layouts.test.mjs`.

**Interfaces:**
- Consumes: `SLIDES` (rótulos da Task 2).
- Produces:
  ```
  type Block =
    | { kind:'hero', title:string, groups:string[], split?:boolean }
    | { kind:'card', title:string, groups:string[], emphasis?:boolean }
    | { kind:'sub', title:string, groups:string[], tone?:'weak' }
    | { kind:'details', title:string, groups:string[] }
    | { kind:'cols', ratio:string, cols:Block[][] }
    | { kind:'grid', blocks:Block[] }
  type SlideLayout = { blocks:Block[], decor?:'paisagem' }
  export const LAYOUTS: Record<string, SlideLayout>   // chave = id do slide
  ```
  Decisões de layout (copiar do mockup v6): `temaN` = `hero` "Identidade do tema" (`split`; grupos `Título do tema`, `Tipo de tema`, `Magnitude`) → `cols 3fr 2fr` [coluna 1: `card` "Tags de poder"; coluna 2: `sub` "Tags de fraqueza" (weak), `sub` "Busca" (grupos `Busca`, `Abandonar`, `Melhoria`, `Marcos`)] → `details` "Melhorias especiais". `identidade` = `hero` "Nome do personagem" + `sub` "Nome do jogador", com `decor: 'paisagem'`. `companhia` = `cols 3fr 2fr` [`card` emphasis "Relações"; `sub` "Tags da Companhia", `sub` weak "Tags de fraqueza", `sub` "Busca"] → `details` "Melhorias especiais". `mochila` = `cols 3fr 2fr` [`card` emphasis "Tags de mochila"; `sub` "Quintessências"]. `estados` = `grid` de 4 `card` "Estado N" → `sub` "Notas adicionais". `promessa` = `card` emphasis "Promessa" → `cols 3fr 2fr` [`card` "História"; `details` "Notas"].

- [ ] **Step 1: Testes que falham**: `LAYOUTS tem uma entrada por slide`; `cada rótulo de grupo de cada slide aparece exatamente uma vez no layout`; `todo rótulo citado no layout existe no slide`; `ratio das cols é "3fr 2fr"`.
- [ ] **Step 2:** `npm test`. Esperado: FAIL (módulo ausente).
- [ ] **Step 3:** Implementar `LAYOUTS` (função auxiliar `themeLayout()` para os 4 temas).
- [ ] **Step 4:** `npm test`. Esperado: PASS.
- [ ] **Step 5:** Commit `feat: layouts dos passos em dados`.

---

### Task 4: Navegação por seções

**Files:** Modify: `src/carousel.js`; Test: `test/carousel.test.mjs`.

**Interfaces:**
- Produces: `type Section = 'personagem'|'temas'|'detalhes'|'exportar'`; `export const SECTION_LABELS: Record<Section,string>` (`Personagem`, `Temas`, `Detalhes`, `Exportar`); `export function sectionOf(i:number): Section` (índice 9 → `exportar`); `export function firstSlideOf(section:Section): number`; `export function stepLabel(i:number): string` → `"Passo 3 de 10 · Temas"`; `export function slideTitle(i:number): string` (`SLIDES[i].title` ou `"Revisão e download"`).

- [ ] **Step 1: Testes que falham**: `sectionOf` para 0,1,4,5,8,9; `firstSlideOf('detalhes') === 5`; `firstSlideOf('exportar') === 9`; `stepLabel(2) === 'Passo 3 de 10 · Temas'`; `stepLabel(9) === 'Passo 10 de 10 · Exportar'`; `slideTitle(9) === 'Revisão e download'`.
- [ ] **Step 2:** `npm test`. Esperado: FAIL.
- [ ] **Step 3:** Implementar em `src/carousel.js` a partir de `SLIDES[i].section`.
- [ ] **Step 4:** `npm test`. Esperado: PASS.
- [ ] **Step 5:** Commit `feat: navegação por seções`.

---

### Task 5: Estado para a tela inicial

**Files:** Modify: `src/state.js`; Test: `test/state.test.mjs`.

**Interfaces:**
- Produces: `State` ganha `savedAt?: number` (ms epoch). `saveState(storage, state, now = Date.now())` grava `savedAt: now`; `loadState` devolve `savedAt` quando válido (número); `importJson` aceita `savedAt` ausente e rejeita não numérico; `exportJson` inclui `savedAt` só se existir.
  `export function hasSaved(state:State): boolean` (há algum valor); `export function clearState(storage): boolean` (remove a chave; nunca lança; `false` se storage nulo/falha); `export function savedAgo(savedAt:number|undefined, now:number): string` (`"agora há pouco"` < 1 min; `"há N min"`; `"há N h"`; `"há N dia(s)"`; `""` se indefinido); `export function homeSummary(state:State): { name:string, themes:string[], step:number, total:number }` (`name` = `Character Name` ou `""`; `themes` = títulos `power0` dos 4 temas não vazios; `step` = `slide + 1`; `total` = `TOTAL_SLIDES`).

- [ ] **Step 1: Testes que falham**: `saveState grava savedAt e loadState devolve`; `save antigo sem savedAt carrega sem erro`; `importJson rejeita savedAt string`; `hasSaved` vazio/preenchido; `clearState apaga e depois loadState devolve vazio`; `clearState com storage que lança devolve false`; `savedAgo` para 30 s, 5 min, 3 h, 2 dias, undefined; `homeSummary` com nome e 2 temas.
- [ ] **Step 2:** `npm test`. Esperado: FAIL.
- [ ] **Step 3:** Implementar em `src/state.js` (`homeSummary` usa `SLIDES` para achar os campos `role: 'power0'` de cada tema).
- [ ] **Step 4:** `npm test`. Esperado: PASS.
- [ ] **Step 5:** Commit `feat: estado para a tela inicial (savedAt, apagar, resumo)`.

---

### Task 6: Imagens embutidas no build

**Files:** Modify: `build.mjs`; Create: `test/ui-assets.test.mjs`; Modify: `test/build.test.mjs`.

**Interfaces:**
- Produces: `window.__UI__: Record<string,string>` (nome sem extensão → `data:image/webp;base64,...`) num `<script>` no `<head>`; `build.mjs` embute só as imagens listadas em `UI_USED` (lista no topo do arquivo; as 35 usadas no v6).
- Test: `todo "--img-X"/"ui('X')" em src/ tem arquivo assets/ui-hd/X.webp`; `todo nome em UI_USED existe`; `dist/index.html contém "__UI__"`, `< 12 MB`, sem `src=http`.

- [ ] **Step 1: Testes que falham** (`ui-assets.test.mjs`, ajuste em `build.test.mjs`).
- [ ] **Step 2:** `npm test`. Esperado: FAIL.
- [ ] **Step 3:** Implementar o mapa em `build.mjs` (lido por `<script>` no `<head>` do template, antes do CSS).
- [ ] **Step 4:** `npm test`. Esperado: PASS.
- [ ] **Step 5:** Commit `feat: imagens em alta resolução embutidas no build`.

---

### Task 7: Visual, casca e telas

**Files:** Rewrite: `src/style.css`, `src/index.template.html`, `src/app.js`; Create: `src/ui.js`, `src/steps.js`, `src/home.js`.

**Interfaces:**
- Consumes: `LAYOUTS`, `SLIDES`, `sectionOf`, `firstSlideOf`, `stepLabel`, `slideTitle`, `homeSummary`, `hasSaved`, `clearState`, `savedAgo`, estado/PDF existentes.
- Produces (DOM): `ui.js` → `h(tag, attrs, ...children)`, `ui(name): string`, `applyUiVars(): void` (cria `--img-<nome>`); `steps.js` → `renderStep(slideIndex, ctx): HTMLElement` (`ctx = { getState(), commit(next), showStatus(msg, kind) }`); `home.js` → `renderHome(ctx): HTMLElement`.
- Comportamento (igual ao v6): tela inicial com dois estados (sem/com personagem; "Apagar" pede `confirm`); abas por seção (clicar leva ao `firstSlideOf`); lateral com ✓ nos concluídos; rodapé com Anterior, barra de progresso de 10 segmentos, ícone Salvar (`.json`), Próximo (oculto no último passo); rótulo "Passo N de 10 · Seção" no canto inferior direito acima do Próximo; botão ☰ Menu volta à tela inicial; Magnitude em medalhões (exclusiva); marcas em losango/riscada via `<label>`+`<input type=checkbox>`; título do tema na fita de louros; `details` recolhíveis; último passo com PDF (vinho, principal), save e abrir save (papel), e avisos ok/erro.
- Fora do escopo (decisões): sem o link "Como usar"; sem o botão "Demo"; fontes sem embutir.

- [ ] **Step 1:** Portar o CSS do v6 para `src/style.css`, trocando `url('../../assets/ui-hd/X.webp')` por `var(--img-X)`; portar o esqueleto HTML para `src/index.template.html`.
- [ ] **Step 2:** Implementar `src/ui.js`, `src/steps.js`, `src/home.js` e reescrever `src/app.js` (reaproveitar `onDownloadPdf`, `onDownloadJson`, `onImport` e a navegação por teclado atuais).
- [ ] **Step 3:** `npm run build` e `npm test`. Esperado: PASS.
- [ ] **Step 4:** Commit `feat: novo visual pergaminho com tela inicial e telas por passo`.

---

### Task 8: Verificação no navegador

**Files:** ajustes em `src/*` conforme o que falhar (cada bug de lógica ganha teste antes).

- [ ] **Step 1:** Servir `dist/` e abrir: console sem erros; tela inicial nos dois estados.
- [ ] **Step 2:** Percorrer os 10 passos por botão, aba e lateral; conferir contagem de campos por passo igual ao `fieldmap` (script no console) e digitar de verdade em 2 campos.
- [ ] **Step 3:** Recarregar: dado e passo voltam; "Continuar" abre no passo salvo; "Apagar" (cancelar e confirmar); Menu volta à inicial.
- [ ] **Step 4:** Último passo: baixar PDF e `.json` (interceptando o download), `%PDF` e nome corretos; save inválido recusado; ficha vazia gera `ficha-sem-nome.pdf`.
- [ ] **Step 5:** 375 px: sem rolagem horizontal em todos os passos e na tela inicial.
- [ ] **Step 6:** Commit final; `superpowers:verification-before-completion` antes de declarar pronto.
