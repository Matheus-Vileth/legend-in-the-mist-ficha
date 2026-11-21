import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { UI_USED } from '../src/ui-names.js';

const root = new URL('../', import.meta.url);

test('UI_USED não tem nomes repetidos', () => {
  assert.equal(new Set(UI_USED).size, UI_USED.length);
});

test('todo nome de UI_USED existe em assets/ui-hd', () => {
  for (const n of UI_USED) assert.ok(existsSync(new URL(`assets/ui-hd/${n}.webp`, root)), `falta assets/ui-hd/${n}.webp`);
});

test('todo "--img-X" e ui("X") citado em src/ está em UI_USED', () => {
  const dir = new URL('src/', root);
  const citados = new Set();
  for (const f of readdirSync(dir)) {
    if (!/\.(css|js|html)$/.test(f) || f === 'ui-names.js') continue;
    const txt = readFileSync(new URL(f, dir), 'utf8');
    for (const m of txt.matchAll(/--img-([a-z0-9-]+)/g)) citados.add(m[1]);
    for (const m of txt.matchAll(/\bui\(\s*['"]([a-z0-9-]+)['"]\s*\)/g)) citados.add(m[1]);
  }
  for (const n of citados) assert.ok(UI_USED.includes(n), `"${n}" é citado em src/ mas não está em UI_USED`);
});
