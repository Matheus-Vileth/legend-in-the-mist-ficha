import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VERSION, createState, setValue, setExclusive, loadState, saveState, exportJson, importJson, setSlide,
  hasSaved, clearState, savedAgo, homeSummary, themeCards,
} from '../src/state.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, v) };
};
const throwing = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };

test('estado inicial é vazio no slide 0', () => {
  assert.deepEqual(createState(), { v: VERSION, slide: 0, values: {} });
});

test('setValue guarda o valor sem mutar o estado original', () => {
  const a = createState();
  const b = setValue(a, 'Character Name', 'Thalía');
  assert.equal(b.values['Character Name'], 'Thalía');
  assert.deepEqual(a.values, {});
});

test('setValue remove a chave quando o valor é vazio ou false', () => {
  let s = setValue(createState(), 'Promise 0', true);
  s = setValue(s, 'Character Name', 'x');
  assert.equal(setValue(s, 'Promise 0', false).values['Promise 0'], undefined);
  assert.equal('Character Name' in setValue(s, 'Character Name', '').values, false);
});

test('setExclusive deixa só um marcado e permite limpar', () => {
  const names = ['A', 'B', 'C'];
  let s = setExclusive(createState(), names, 'B');
  assert.deepEqual(s.values, { B: true });
  s = setExclusive(s, names, 'C');
  assert.deepEqual(s.values, { C: true });
  assert.deepEqual(setExclusive(s, names, null).values, {});
});

test('setSlide guarda o slide', () => {
  assert.equal(setSlide(createState(), 4).slide, 4);
});

test('saveState e loadState fazem ida e volta', () => {
  const st = memory();
  const s = setSlide(setValue(createState(), 'Player Name', 'Ana'), 3);
  assert.equal(saveState(st, s, 1700000000000), true);
  assert.deepEqual(loadState(st), { ...s, savedAt: 1700000000000 });
});

test('loadState com JSON corrompido devolve estado vazio', () => {
  const st = memory();
  st.setItem('lim-ficha-v1', '{não é json');
  assert.deepEqual(loadState(st), createState());
});

test('loadState com storage que lança, ou nulo, devolve estado vazio', () => {
  assert.deepEqual(loadState(throwing), createState());
  assert.deepEqual(loadState(null), createState());
});

test('saveState devolve false quando o storage lança ou é nulo', () => {
  assert.equal(saveState(throwing, createState()), false);
  assert.equal(saveState(null, createState()), false);
});

test('importJson rejeita versão 2', () => {
  const r = importJson(JSON.stringify({ v: 2, slide: 0, values: {} }));
  assert.equal(r.ok, false);
  assert.match(r.error, /vers/i);
});

test('importJson rejeita values com número', () => {
  const r = importJson(JSON.stringify({ v: 1, slide: 0, values: { 'Character Name': 5 } }));
  assert.equal(r.ok, false);
});

test('importJson rejeita texto que não é JSON', () => {
  assert.equal(importJson('olá').ok, false);
});

test('exportJson e importJson fazem ida e volta', () => {
  const s = setValue(setValue(createState(), 'Character Name', 'Éowyn'), 'Promise 2', true);
  const r = importJson(exportJson(s));
  assert.equal(r.ok, true);
  assert.deepEqual(r.state, s);
});

// ---- tela inicial: data, apagar, resumo ----
const memoria = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};
const quebrado = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };

test('saveState grava savedAt e loadState devolve', () => {
  const st = memoria();
  saveState(st, createState(), 1234);
  assert.equal(loadState(st).savedAt, 1234);
});

test('save antigo, sem savedAt, carrega sem erro e sem data', () => {
  const st = memoria();
  st.setItem('lim-ficha-v1', JSON.stringify({ v: 1, slide: 3, values: { 'Character Name': 'Ana' } }));
  const s = loadState(st);
  assert.equal(s.slide, 3);
  assert.equal(s.values['Character Name'], 'Ana');
  assert.equal(s.savedAt, undefined);
});

test('importJson rejeita savedAt que não é número', () => {
  assert.equal(importJson(JSON.stringify({ v: 1, slide: 0, values: {}, savedAt: 'ontem' })).ok, false);
});

test('exportJson inclui savedAt só quando existe', () => {
  assert.equal('savedAt' in JSON.parse(exportJson(createState())), false);
  assert.equal(JSON.parse(exportJson({ ...createState(), savedAt: 99 })).savedAt, 99);
});

test('hasSaved é falso no estado vazio e verdadeiro com algum valor', () => {
  assert.equal(hasSaved(createState()), false);
  assert.equal(hasSaved(setValue(createState(), 'Character Name', 'Ana')), true);
});

test('clearState apaga e depois loadState devolve o estado vazio', () => {
  const st = memoria();
  saveState(st, setValue(createState(), 'Character Name', 'Ana'), 1);
  assert.equal(clearState(st), true);
  assert.deepEqual(loadState(st), createState());
});

test('clearState devolve false com storage que lança ou nulo', () => {
  assert.equal(clearState(quebrado), false);
  assert.equal(clearState(null), false);
});

test('savedAgo descreve o tempo em português', () => {
  const now = 1_000_000_000_000;
  assert.equal(savedAgo(now - 30_000, now), 'agora há pouco');
  assert.equal(savedAgo(now + 5_000, now), 'agora há pouco');
  assert.equal(savedAgo(now - 5 * 60_000, now), 'há 5 min');
  assert.equal(savedAgo(now - 3 * 3_600_000, now), 'há 3 h');
  assert.equal(savedAgo(now - 86_400_000, now), 'há 1 dia');
  assert.equal(savedAgo(now - 2 * 86_400_000, now), 'há 2 dias');
  assert.equal(savedAgo(undefined, now), '');
});

test('homeSummary traz nome, títulos dos temas preenchidos, passo e total', () => {
  let s = createState();
  s = setValue(s, 'Character Name', 'Thalía');
  s = setValue(s, 'Theme Card 0 Power Tag 0', 'Ferreiro de aldeia');
  s = setValue(s, 'Theme Card 2 Power Tag 0', 'Herdeira do trono');
  s = setSlide(s, 2);
  assert.deepEqual(homeSummary(s), { name: 'Thalía', themes: ['Ferreiro de aldeia', 'Herdeira do trono'], step: 3, total: 10 });
  assert.deepEqual(homeSummary(createState()), { name: '', themes: [], step: 1, total: 10 });
});

test('themeCards resume os 4 temas (título, tipo, Magnitude e nº de tags de poder)', () => {
  let s = createState();
  s = setValue(s, 'Theme Card 0 Power Tag 0', 'Ferreiro');
  s = setValue(s, 'Theme Card 0  Power Tag 3', 'Martelo');
  s = setValue(s, 'Theme Card 0 Type', 'Habilidade ou Ofício');
  s = setValue(s, 'Theme Card 0 Adventure', true);
  const c = themeCards(s);
  assert.equal(c.length, 4);
  assert.deepEqual(c[0], { n: 1, title: 'Ferreiro', type: 'Habilidade ou Ofício', might: 'Aventura', tags: 2 });
  assert.deepEqual(c[1], { n: 2, title: '', type: '', might: '', tags: 0 });
});

test('themeCards entende a Magnitude Grandeza do Tema 3 (campo Greatness1)', () => {
  const s = setValue(createState(), 'Theme Card 2 Greatness1', true);
  assert.equal(themeCards(s)[2].might, 'Grandeza');
});
