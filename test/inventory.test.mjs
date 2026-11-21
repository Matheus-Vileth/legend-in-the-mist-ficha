import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const fields = JSON.parse(readFileSync(new URL('../assets/fields.json', import.meta.url), 'utf8'));

test('inventário tem os 324 campos do PDF', () => {
  assert.equal(fields.length, 324);
});

test('nomes de campo são únicos', () => {
  assert.equal(new Set(fields.map((f) => f.name)).size, fields.length);
});

test('campos-chave existem com o tipo certo', () => {
  const by = Object.fromEntries(fields.map((f) => [f.name, f]));
  assert.equal(by['Character Name'].type, 'text');
  assert.equal(by['Promise 0'].type, 'check');
});
