import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url);

test('npm run build gera dist/index.html autossuficiente', () => {
  execFileSync(process.execPath, ['build.mjs'], { cwd: root, stdio: 'pipe' });
  const file = new URL('dist/index.html', root);
  const html = readFileSync(file, 'utf8');
  const size = statSync(file).size;
  assert.ok(size > 1_000_000 && size < 12_000_000, `tamanho inesperado: ${size}`);
  assert.match(html, /<title>Ficha — Legend in the Mist<\/title>/);
  assert.match(html, /__FICHA_PDF_B64__/);
  assert.doesNotMatch(html, /(src|href)=["']https?:/i);
  assert.doesNotMatch(html, /\{\{(CSS|JS|PDF_B64)\}\}/);
});
