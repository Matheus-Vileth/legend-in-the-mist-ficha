import { test } from 'node:test';
import assert from 'node:assert/strict';
import { norm } from '../src/text.js';
import {
  GUIDE_KEY, defaultPrefs, loadPrefs, savePrefs, tipsFor, findTerm, searchTerms, linkTerms,
} from '../src/guide.js';

const memoria = (inicial) => {
  const m = new Map(inicial ? [[GUIDE_KEY, inicial]] : []);
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, v) };
};
const quebrado = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };

const T = [
  { id: 'tag', pt: 'tag', en: 'Tag', curto: 'x', apelidos: ['tags'] },
  { id: 'tag-de-poder', pt: 'tag de poder', en: 'Power tag', curto: 'x', apelidos: ['tags de poder'] },
  { id: 'busca', pt: 'Busca', en: 'Quest', curto: 'x' },
  { id: 'relacao', pt: 'Relação', en: 'Relationship tag', curto: 'x' },
];
const juntar = (segs) => segs.map((s) => s.v).join('');
const termos = (segs) => segs.filter((s) => s.t === 'termo');

test('norm tira acento, caixa e espaços das pontas', () => {
  assert.equal(norm('  Ação ÇÃO '), 'acao cao');
});

test('GUIDE_KEY é a chave própria do guia', () => {
  assert.equal(GUIDE_KEY, 'lim-guia-v1');
});

test('defaultPrefs é ligado e aberto', () => {
  assert.deepEqual(defaultPrefs(), { on: true, open: true });
});

test('loadPrefs com storage vazio, corrompido, nulo ou que lança devolve o padrão', () => {
  assert.deepEqual(loadPrefs(memoria()), defaultPrefs());
  assert.deepEqual(loadPrefs(memoria('{não é json')), defaultPrefs());
  assert.deepEqual(loadPrefs(null), defaultPrefs());
  assert.deepEqual(loadPrefs(quebrado), defaultPrefs());
});

test('loadPrefs aproveita campo válido e ignora campo inválido', () => {
  assert.deepEqual(loadPrefs(memoria('{"on":false,"open":"sim"}')), { on: false, open: true });
  assert.deepEqual(loadPrefs(memoria('{"on":1}')), defaultPrefs());
});

test('savePrefs e loadPrefs fazem ida e volta', () => {
  const st = memoria();
  assert.equal(savePrefs(st, { on: false, open: false }), true);
  assert.deepEqual(loadPrefs(st), { on: false, open: false });
});

test('savePrefs devolve false quando o storage lança ou é nulo', () => {
  assert.equal(savePrefs(quebrado, defaultPrefs()), false);
  assert.equal(savePrefs(null, defaultPrefs()), false);
});

test('tipsFor devolve [] para passo desconhecido e uma cópia para conhecido', () => {
  assert.deepEqual(tipsFor('nao-existe'), []);
  const a = tipsFor('tema1');
  assert.ok(a.length >= 1);
  a.push('lixo');
  assert.ok(!tipsFor('tema1').includes('lixo'));
});

test('findTerm acha por id e devolve null se não existe', () => {
  assert.equal(findTerm('busca').pt, 'Busca');
  assert.equal(findTerm('nada'), null);
});

test('searchTerms ignora acento e caixa e busca em pt, en e curto', () => {
  const termos = [
    { id: 'busca', pt: 'Busca', en: 'Quest', curto: 'Move o tema.' },
    { id: 'magnitude', pt: 'Magnitude', en: 'Might', curto: 'O tamanho do tema.' },
  ];
  assert.deepEqual(searchTerms('QUEST', termos).map((t) => t.id), ['busca']);
  assert.deepEqual(searchTerms('magnitude', termos).map((t) => t.id), ['magnitude']);
  assert.deepEqual(searchTerms('zzzz', termos), []);
});

test('searchTerms vazio devolve todos em ordem alfabética de pt', () => {
  const todos = searchTerms('');
  const nomes = todos.map((t) => t.pt);
  assert.deepEqual(nomes, [...nomes].sort((a, b) => a.localeCompare(b, 'pt')));
  assert.ok(todos.length >= 3);
});

test('linkTerms: texto vazio devolve lista vazia; sem termos devolve um trecho só', () => {
  assert.deepEqual(linkTerms('', T), []);
  assert.deepEqual(linkTerms('nada a marcar aqui', T), [{ t: 'txt', v: 'nada a marcar aqui' }]);
});

test('linkTerms reconstrói o texto original', () => {
  const txt = 'Escolha a Busca e as tags de poder; use a tag. A Relação importa.';
  assert.equal(juntar(linkTerms(txt, T)), txt);
});

test('linkTerms só marca palavra inteira ("Buscar" não casa "Busca")', () => {
  const s = linkTerms('Buscar a busca', T);
  assert.deepEqual(termos(s).map((x) => x.v), ['busca']);
  assert.equal(juntar(s), 'Buscar a busca');
});

test('linkTerms marca só a primeira ocorrência de cada termo', () => {
  const s = linkTerms('Busca e busca e BUSCA', T);
  assert.deepEqual(termos(s).map((x) => x.v), ['Busca']);
});

test('linkTerms casa apelidos ("tags de poder")', () => {
  const s = linkTerms('as tags de poder', T);
  assert.deepEqual(termos(s).map((x) => [x.id, x.v]), [['tag-de-poder', 'tags de poder']]);
});

test('linkTerms ignora caixa e acento', () => {
  const s = linkTerms('a RELACAO forte e a relação', T);
  assert.deepEqual(termos(s).map((x) => [x.id, x.v]), [['relacao', 'RELACAO']]);
});

test('linkTerms trata < e & como texto comum', () => {
  const txt = 'a <b> & a Busca <script>';
  const s = linkTerms(txt, T);
  assert.equal(juntar(s), txt);
  assert.deepEqual(termos(s).map((x) => x.v), ['Busca']);
});

test('linkTerms prefere o termo mais longo e ainda marca a tag solta', () => {
  const s = linkTerms('a tag de poder e a tag', T);
  assert.deepEqual(termos(s).map((x) => [x.id, x.v]), [['tag-de-poder', 'tag de poder'], ['tag', 'tag']]);
});
