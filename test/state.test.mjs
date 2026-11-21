import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VERSION, createState, setValue, setExclusive, loadState, saveState, exportJson, importJson, setSlide,
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
  assert.equal(saveState(st, s), true);
  assert.deepEqual(loadState(st), s);
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
