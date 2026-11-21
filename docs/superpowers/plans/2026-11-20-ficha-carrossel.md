# Ficha de Legend in the Mist em carrossel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um `dist/index.html` único e offline em que se preenche a ficha de herói de Legend in the Mist em slides, e se baixa o PDF oficial preenchido e um save `.json`.

**Architecture:** Os valores vivem num único objeto `values` cuja chave é o **nome exato do campo do PDF**. Os slides (UI) são só um layout sobre esses nomes (`fieldmap.js`). `pdf-lib` abre o PDF oficial embutido e escreve em cada campo. Um build com esbuild empacota tudo (JS, CSS, pdf-lib, PDF em base64) num HTML.

**Tech Stack:** JavaScript ES modules, Node 24 (`node --test`), `pdf-lib`, `esbuild` (dev). Sem framework.

**Spec:** `docs/superpowers/specs/2026-11-20-ficha-carrossel-design.md`

## Global Constraints

- Projeto em `D:\Projetos_Ativos\legend-in-the-mist-ficha`. Nada no C:. Cache do npm: `NPM_CONFIG_CACHE=D:\dev-tools\npm-cache`. Arquivos temporários de PDF/imagem: só em `D:\dev-tools\tmp`.
- Interface e dicas em português, termos conforme a tabela de tradução do spec (Magnitude, Busca, Companhia, Mochila, Promessa, Quintessência, Origem/Aventura/Grandeza...).
- Funciona offline abrindo o `index.html` (sem servidor, sem CDN). Sem erro se `localStorage` falhar (try/catch em toda leitura e escrita).
- PDF oficial fonte: `D:\Pichau\Downloads\Pdf's\51823-Legend_in_the_Mist_Character_Sheet_(Portrait_Orientation_Form-Fillable).pdf`, copiado para `assets/ficha.pdf`. Não publicar o site abertamente.
- Texto vai ao PDF como digitado, em português (acentos devem sair certos). Rótulos impressos do PDF ficam em inglês.
- Responsivo (celular), 16px de gutter, navegação por botões, pontos, setas do teclado.
- Commits pequenos; `git init` na tarefa 1. Mensagens terminam com a linha `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Texto muito longo num campo pequeno do PDF: não quebrar o download; texto reduz de fonte ou é cortado, nunca erro.
2. Caracteres fora do WinAnsi (emoji, japonês): o download não pode falhar; substituir por `?`.
3. `localStorage` indisponível ou com JSON corrompido: o site abre vazio e funciona.
4. Importar um `.json` inválido ou de outra versão: mensagem de erro, estado atual intacto.
5. Baixar com a ficha totalmente vazia: gera PDF válido (nome `ficha-sem-nome.pdf`).

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `package.json` | scripts `test`, `build`, deps `pdf-lib`, dev `esbuild` |
| `assets/ficha.pdf` | PDF oficial |
| `tools/dump-fields.mjs` | lê o PDF, grava `assets/fields.json` (nome, tipo, página, retângulo) |
| `src/fieldmap.js` | `SLIDES`, `allMappedNames()`, `IGNORED_FIELDS` |
| `src/state.js` | estado, autosave, export/import JSON, grupo exclusivo |
| `src/pdf.js` | `fillSheet`, `sheetFileName` |
| `src/carousel.js` | lógica pura de navegação |
| `src/app.js` | renderiza slides, liga eventos, downloads |
| `src/index.template.html`, `src/style.css` | casca e visual |
| `build.mjs` | gera `dist/index.html` |
| `test/*.test.mjs` | testes (`node --test`) |

---

### Task 1: Projeto, PDF e inventário de campos

**Files:**
- Create: `package.json`, `.gitignore` (`node_modules`, `dist`), `assets/ficha.pdf`, `tools/dump-fields.mjs`, `assets/fields.json`, `test/inventory.test.mjs`

**Interfaces:**
- Produces: `assets/fields.json` = `Array<{name:string,type:'text'|'check',page:0|1,rect:[x1,y1,x2,y2]}>` (324 itens). Consumida pelas tarefas 2 e 4 (testes).

- [ ] **Step 1: Preparar o projeto**: `git init`, `npm init -y` (type `module`), `npm i pdf-lib` e `npm i -D esbuild` com `NPM_CONFIG_CACHE=D:\dev-tools\npm-cache`. Copiar o PDF para `assets/ficha.pdf`. Scripts: `"test": "node --test test/"`, `"build": "node build.mjs"`.
- [ ] **Step 2: Teste falhando** em `test/inventory.test.mjs`: carrega `assets/fields.json`; `assert.equal(fields.length, 324)`; todo `name` é único; existe `'Character Name'` (text) e `'Promise 0'` (check).
- [ ] **Step 3: Rodar** `npm test`. Esperado: FAIL (arquivo ausente).
- [ ] **Step 4: Implementar `tools/dump-fields.mjs`**: com `PDFDocument.load`, percorrer `form.getFields()`, para cada widget pegar página (índice em `doc.getPages()` via `widget.P()`) e `getRectangle()`; gravar JSON ordenado por página, depois `y` decrescente, depois `x`. Rodar `node tools/dump-fields.mjs`.
- [ ] **Step 5: Rodar** `npm test`. Esperado: PASS.
- [ ] **Step 6: Commit** (`chore: projeto, pdf oficial e inventário de campos`).

---

### Task 2: Mapa de campos e slides

Resolve as irregularidades do PDF pelo **retângulo/posição**, não pelo nome.

**Files:**
- Create: `src/fieldmap.js`, `test/fieldmap.test.mjs`

**Interfaces:**
- Consumes: `assets/fields.json`.
- Produces:
  - `type Field = { name:string, kind:'text'|'long'|'check', label:string, options?:string[] }`
  - `type Group = { label:string, fields:Field[], exclusive?:boolean }` (`exclusive`: só um marcado, usado em Magnitude)
  - `type Slide = { id:string, title:string, hint:string, groups:Group[] }`
  - `export const SLIDES: Slide[]` (8 slides de edição; o 9º, Revisão e Download, é montado em `app.js`)
  - `export function allMappedNames(): string[]`
  - `export const IGNORED_FIELDS: string[]` (campos do PDF deliberadamente não expostos, cada um com comentário do motivo)
  - `export const THEME_TYPES: Record<'Origem'|'Aventura'|'Grandeza'|'Variam', string[]>` (lista do spec)

- [ ] **Step 1: Descobrir o significado dos campos estranhos.** Abrir `assets/ficha.pdf` no navegador do app (`file:///D:/Projetos_Ativos/legend-in-the-mist-ficha/assets/ficha.pdf`), ver as páginas e cruzar com `fields.json` para decidir: (a) `Tag 0..3` + `Tag N Tier 0-5` + `Tag N Note 0-2` + `Tag Additional Notes 0-1` (provável trilha de Estados/Status); (b) `Theme Card 0 Weakness Tag 3` (provavelmente 2ª fraqueza do Tema 2); (c) `Theme Card 0  Power Tag 3` com dois espaços; (d) `Theme Card 2 Greatness1`; (e) `Scratched` do Tema 3 aparece como `Theme Card 3 Scratched 0..7` e `Theme Card 2 Scratched`; (f) `Fellowship Weakness 0-1`, `Fellowship Special Improvements 0-14`. Registrar a conclusão em comentário no topo de `fieldmap.js`.
- [ ] **Step 2: Testes falhando** em `test/fieldmap.test.mjs`:
  - todo nome de `allMappedNames()` existe em `fields.json`;
  - nenhum nome aparece duas vezes;
  - `[...allMappedNames(), ...IGNORED_FIELDS]` cobre exatamente os 324 campos (nenhum esquecido);
  - `SLIDES.map(s=>s.id)` igual a `['identidade','tema1','tema2','tema3','tema4','companhia','mochila','promessa']`;
  - cada slide de tema tem um grupo `exclusive` com 3 campos `check` rotulados Origem, Aventura, Grandeza.
- [ ] **Step 3: Rodar**. Esperado: FAIL.
- [ ] **Step 4: Implementar `fieldmap.js`.** Slides: `identidade` (Character Name, Player Name); `tema1..4` (Tipo de tema com `options` de `THEME_TYPES`, Magnitude exclusiva, 7 tags de poder — a 1ª rotulada "Título do tema", 2 fraquezas, Busca 3 linhas, Marco/Abandonar/Melhoria 3 checks cada, Melhorias especiais 13 linhas, Riscadas 7-8 checks); `companhia`; `mochila` (Backpack Tags 0-4, Quintessences 0-3, mais os campos `Tag*` conforme o passo 1); `promessa` (Promise 0-4, History 0-7, Notes 0-22). Cada `hint` em português com a dica do livro (Hero Creation, pp. 77-78: "primeira tag = título do tema", "tags de poder devem ser úteis, de fraqueza devem limitar", Busca como Desejo/Verdade/Lar/Pergunta). Geração por laço para os 4 temas, com função auxiliar `themeSlide(i)`.
- [ ] **Step 5: Rodar**. Esperado: PASS.
- [ ] **Step 6: Commit** (`feat: mapa de campos e slides`).

---

### Task 3: Estado, autosave e save JSON

**Files:**
- Create: `src/state.js`, `test/state.test.mjs`

**Interfaces:**
- Produces:
  - `export const VERSION = 1`
  - `type State = { v:1, slide:number, values: Record<string,string|boolean> }`
  - `export function createState(): State` (slide 0, values `{}`)
  - `export function setValue(s:State, name:string, value:string|boolean): State` (imutável; string vazia e `false` removem a chave)
  - `export function setExclusive(s:State, names:string[], chosen:string|null): State` (marca `chosen`, desmarca os demais)
  - `export function loadState(storage:{getItem(k):string|null}|null): State` (nunca lança; JSON ruim, versão diferente ou `null` → `createState()`)
  - `export function saveState(storage:{setItem(k,v):void}|null, s:State): boolean` (nunca lança; devolve se salvou). Chave `'lim-ficha-v1'`.
  - `export function exportJson(s:State): string`
  - `export function importJson(text:string): { ok:true, state:State } | { ok:false, error:string }` (valida `v===1`, `values` objeto com valores string ou boolean)

- [ ] **Step 1: Testes falhando** em `test/state.test.mjs` (nomes): `setValue guarda e remove vazio`, `setExclusive deixa só um marcado`, `loadState com JSON corrompido devolve estado vazio`, `loadState com storage que lança devolve estado vazio`, `saveState devolve false quando storage lança`, `importJson rejeita versão 2`, `importJson rejeita values com número`, `exportJson e importJson fazem ida e volta`.
- [ ] **Step 2: Rodar** `npm test`. Esperado: FAIL.
- [ ] **Step 3: Implementar** as funções acima em `src/state.js`.
- [ ] **Step 4: Rodar**. Esperado: PASS.
- [ ] **Step 5: Commit** (`feat: estado, autosave e save json`).

---

### Task 4: Preencher o PDF

**Files:**
- Create: `src/pdf.js`, `test/pdf.test.mjs`

**Interfaces:**
- Consumes: `State.values` (chaves = nomes de campo do PDF).
- Produces:
  - `export async function fillSheet(pdfBytes:Uint8Array, values:Record<string,string|boolean>): Promise<Uint8Array>`
  - `export function toWinAnsi(text:string): string` (troca caracteres que a fonte Helvetica/WinAnsi não codifica por `?`, mantém acentos do português, aspas curvas e travessão)
  - `export function sheetFileName(characterName:string|undefined): string` (`ficha-<nome-em-kebab-sem-acento>.pdf`, ou `ficha-sem-nome.pdf`)
  - Nome de campo desconhecido em `values`: ignorado (não lança).

- [ ] **Step 1: Testes falhando** em `test/pdf.test.mjs`, lendo `assets/ficha.pdf`; após `fillSheet`, recarregar com `PDFDocument.load` e ler os campos:
  - `fillSheet escreve 'Character Name' = "Thalía Éowyn Çevik"` e `getTextField(...).getText()` igual;
  - `marca 'Promise 0' como true` (`isChecked()`), e `'Promise 1'` fica desmarcado;
  - `ignora nome de campo desconhecido`;
  - `texto de 5000 caracteres em 'Notes 0' não lança`;
  - `emoji vira '?'` (`toWinAnsi('espada 🗡️')` contém `?` e não contém o emoji);
  - `sheetFileName('Thalía Éowyn') === 'ficha-thalia-eowyn.pdf'` e `sheetFileName('') === 'ficha-sem-nome.pdf'`;
  - `fillSheet com values vazio devolve PDF com 2 páginas`.
- [ ] **Step 2: Rodar**. Esperado: FAIL.
- [ ] **Step 3: Implementar.** `PDFDocument.load`, `form = doc.getForm()`; para texto `setText(toWinAnsi(v))` e `setFontSize(0)` quando o campo permitir auto-tamanho (senão fonte fixa 9); para check `check()`/`uncheck()`. Embutir Helvetica e chamar `form.updateFieldAppearances(font)` antes de `save()`. Não achatar o formulário (o PDF continua editável).
- [ ] **Step 4: Rodar**. Esperado: PASS. Em seguida salvar um PDF de amostra com todos os campos de texto cheios em `D:\dev-tools\tmp\amostra.pdf` e conferir visualmente no navegador do app que o texto aparece nos lugares certos; ajustar se houver campo cortado.
- [ ] **Step 5: Commit** (`feat: preencher pdf oficial`).

---

### Task 5: Lógica do carrossel

**Files:**
- Create: `src/carousel.js`, `test/carousel.test.mjs`

**Interfaces:**
- Produces: `export const TOTAL_SLIDES = 9`; `export function clampSlide(i:number): number` (0..8, não inteiro vira 0); `export function nextSlide(i)`, `export function prevSlide(i)` (travam nas pontas).

- [ ] **Step 1: Testes falhando**: `clampSlide(-3)===0`, `clampSlide(99)===8`, `clampSlide(NaN)===0`, `nextSlide(8)===8`, `prevSlide(0)===0`, `nextSlide(3)===4`.
- [ ] **Step 2: Rodar**. FAIL. **Step 3: Implementar.** **Step 4: Rodar**. PASS.
- [ ] **Step 5: Commit** (`feat: logica do carrossel`).

---

### Task 6: Interface, estilo e build

**Files:**
- Create: `src/app.js`, `src/index.template.html`, `src/style.css`, `build.mjs`, `test/build.test.mjs`

**Interfaces:**
- Consumes: `SLIDES`, `THEME_TYPES`, state/pdf/carousel das tarefas 2-5.
- Produces: `dist/index.html`; `app.js` lê o PDF de `window.__FICHA_PDF_B64__` (string base64 injetada pelo build).

- [ ] **Step 1: Teste falhando** em `test/build.test.mjs`: roda `node build.mjs`; `dist/index.html` existe; contém `__FICHA_PDF_B64__`; **não** contém `src="http` nem `href="http`; tamanho entre 1 MB e 12 MB; contém o título `Ficha — Legend in the Mist`.
- [ ] **Step 2: Rodar**. FAIL.
- [ ] **Step 3: Implementar `build.mjs`**: esbuild `bundle` de `src/app.js` (format `iife`, minify) com `pdf-lib` importado de `node_modules`; ler `src/style.css`; ler `assets/ficha.pdf` em base64; substituir marcadores `{{CSS}}`, `{{JS}}`, `{{PDF_B64}}` em `src/index.template.html`; gravar `dist/index.html`.
- [ ] **Step 4: Implementar a UI** (`app.js`): para cada slide renderiza título, `hint`, grupos e campos (texto, área, check; `options` via `<datalist>`; grupos `exclusive` via `setExclusive`). Cada alteração chama `setValue` + `saveState`. Barra inferior: Anterior/Próximo, pontos clicáveis, setas ← → do teclado, indicador "n/9". Slide 9 "Revisão e Download": resumo (nome, temas com título e Magnitude, nº de tags) e botões **Baixar PDF** (`fillSheet` → Blob → `<a download>` com `sheetFileName`), **Baixar save (.json)**, **Abrir save** (`<input type=file>` → `importJson`; em erro mostra mensagem e não troca o estado). Slide atual também é salvo e restaurado ao recarregar. Estilo: tema escuro de pergaminho, fonte do sistema com serifa, alvos de toque ≥ 44px.
- [ ] **Step 5: Rodar** `npm run build` e `npm test`. Esperado: PASS.
- [ ] **Step 6: Commit** (`feat: interface do carrossel e build`).

---

### Task 7: Verificação no navegador

**Files:** nenhum novo (ajustes em `src/*` se algo falhar; cada ajuste com teste quando for lógica).

- [ ] **Step 1:** Abrir `dist/index.html` no navegador do app (`file:///D:/Projetos_Ativos/legend-in-the-mist-ficha/dist/index.html`), sem erros no console.
- [ ] **Step 2:** Preencher todos os 8 slides, incluindo acentos e um texto longo; recarregar e conferir que tudo e o slide atual voltam.
- [ ] **Step 3:** No slide 9, baixar o PDF; abrir o PDF baixado e conferir os campos nos lugares certos (Magnitude marcada, tags de poder, Busca, Mochila, Promessa).
- [ ] **Step 4:** Baixar o `.json`, limpar o `localStorage`, recarregar, abrir o save e confirmar restauração. Tentar abrir um `.json` inválido: mensagem de erro e estado intacto.
- [ ] **Step 5:** Largura 375px (celular): sem rolagem horizontal, botões tocáveis.
- [ ] **Step 6:** Baixar com a ficha vazia: PDF válido `ficha-sem-nome.pdf`.
- [ ] **Step 7: Commit** final e, só então, usar `superpowers:verification-before-completion` antes de dizer que está pronto.
