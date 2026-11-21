// Gera dist/index.html: HTML único com CSS, JS (esbuild), pdf-lib e o PDF oficial (base64) embutidos.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { build } from 'esbuild';
import { UI_USED } from './src/ui-names.js';

const root = new URL('./', import.meta.url);
const read = (p, enc) => readFileSync(new URL(p, root), enc);

const bundle = await build({
  entryPoints: [new URL('src/app.js', root).pathname.replace(/^\/([A-Za-z]:)/, '$1')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2020',
  write: false,
  legalComments: 'none',
});

const js = bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = read('src/style.css', 'utf8');
const pdfB64 = read('assets/ficha.pdf').toString('base64');
const pdfScript = `window.__FICHA_PDF_B64__="${pdfB64}";`;

// Imagens de interface: mapa nome -> data URI e variáveis CSS --img-<nome> (aplicadas já no <head>, sem piscar).
const uiMap = Object.fromEntries(
  UI_USED.map((n) => [n, 'data:image/webp;base64,' + read(`assets/ui-hd/${n}.webp`).toString('base64')]),
);
const uiScript =
  `window.__UI__=${JSON.stringify(uiMap)};` +
  `for(var k in window.__UI__)document.documentElement.style.setProperty('--img-'+k,'url('+window.__UI__[k]+')');`;

// Usa funções de substituição para que "$" no JS/CSS nunca seja interpretado pelo replace.
const html = read('src/index.template.html', 'utf8')
  .replace('{{UI_MAP}}', () => uiScript)
  .replace('{{CSS}}', () => css)
  .replace('{{PDF_B64}}', () => pdfScript)
  .replace('{{JS}}', () => js);

mkdirSync(new URL('dist/', root), { recursive: true });
writeFileSync(new URL('dist/index.html', root), html);
console.log(`dist/index.html: ${(html.length / 1e6).toFixed(2)} MB`);
