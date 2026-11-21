import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterOptions } from '../src/combo.js';

const TIPOS = ['Circunstância', 'Devoção', 'Dever', 'Relíquia', 'Ser Sobrenatural', 'Habilidade ou Ofício'];

test('filterOptions: texto vazio devolve todas as opções, na ordem', () => {
  assert.deepEqual(filterOptions(TIPOS, ''), TIPOS);
  assert.deepEqual(filterOptions(TIPOS, '   '), TIPOS);
});

test('filterOptions: busca por trecho, sem diferenciar maiúsculas', () => {
  assert.deepEqual(filterOptions(TIPOS, 'DEV'), ['Devoção', 'Dever']);
});

test('filterOptions: ignora acentos nos dois lados', () => {
  assert.deepEqual(filterOptions(TIPOS, 'circunstancia'), ['Circunstância']);
  assert.deepEqual(filterOptions(TIPOS, 'RELÍQUIA'), ['Relíquia']);
  assert.deepEqual(filterOptions(TIPOS, 'reliquia'), ['Relíquia']);
});

test('filterOptions: quem começa com o texto vem antes de quem só contém', () => {
  assert.deepEqual(filterOptions(['Banana', 'Anão', 'Nabo'], 'an'), ['Anão', 'Banana']);
});

test('filterOptions: sem correspondência devolve lista vazia', () => {
  assert.deepEqual(filterOptions(TIPOS, 'zzz'), []);
});

test('filterOptions: busca no meio de nomes com mais de uma palavra', () => {
  assert.deepEqual(filterOptions(TIPOS, 'sobre'), ['Ser Sobrenatural']);
  assert.deepEqual(filterOptions(TIPOS, 'ou of'), ['Habilidade ou Ofício']);
});
