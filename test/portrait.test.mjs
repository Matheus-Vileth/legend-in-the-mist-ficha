import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PORTRAIT_KEY, MAX_SIDE, isImageType, fitWithin, isPortraitDataUrl } from '../src/portrait.js';

test('PORTRAIT_KEY não colide com nenhum campo do PDF', async () => {
  const { readFileSync } = await import('node:fs');
  const campos = JSON.parse(readFileSync(new URL('../assets/fields.json', import.meta.url), 'utf8')).map((f) => f.name);
  assert.ok(!campos.includes(PORTRAIT_KEY));
});

test('isImageType aceita png, jpeg, webp, gif e bmp', () => {
  for (const t of ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'IMAGE/PNG']) assert.equal(isImageType(t), true, t);
});

test('isImageType recusa svg, texto, vazio e indefinido', () => {
  for (const t of ['image/svg+xml', 'text/plain', 'application/pdf', '', undefined, null]) assert.equal(isImageType(t), false, String(t));
});

test('fitWithin reduz mantendo a proporção quando passa do limite', () => {
  assert.deepEqual(fitWithin(1280, 640, 640), { w: 640, h: 320 });
  assert.deepEqual(fitWithin(600, 1200, 640), { w: 320, h: 640 });
  assert.deepEqual(fitWithin(4000, 4000, MAX_SIDE), { w: MAX_SIDE, h: MAX_SIDE });
});

test('fitWithin não amplia imagem pequena', () => {
  assert.deepEqual(fitWithin(300, 200, 640), { w: 300, h: 200 });
});

test('fitWithin devolve null para dimensões inválidas', () => {
  for (const [w, h] of [[0, 10], [10, 0], [-5, 10], [NaN, 10], [10, Infinity]]) assert.equal(fitWithin(w, h, 640), null, `${w}x${h}`);
});

test('fitWithin nunca devolve lado zero (imagens muito estreitas)', () => {
  const r = fitWithin(10000, 1, 640);
  assert.equal(r.w, 640);
  assert.equal(r.h, 1);
});

test('isPortraitDataUrl aceita data URL base64 de jpeg, png e webp', () => {
  for (const t of ['jpeg', 'png', 'webp']) assert.equal(isPortraitDataUrl(`data:image/${t};base64,AAAA/+bb==`), true, t);
});

test('isPortraitDataUrl recusa endereços externos, svg, script e lixo', () => {
  for (const v of ['http://exemplo.com/a.png', 'https://x/y.jpg', 'javascript:alert(1)', 'data:image/svg+xml;base64,AAAA', 'data:text/html;base64,AAAA', 'data:image/png;base64,', 'data:image/png;base64,**', 'texto', '', true, 5, undefined, null]) {
    assert.equal(isPortraitDataUrl(v), false, String(v));
  }
});

test('isPortraitDataUrl recusa dados grandes demais', () => {
  assert.equal(isPortraitDataUrl('data:image/jpeg;base64,' + 'A'.repeat(3_000_001)), false);
});
