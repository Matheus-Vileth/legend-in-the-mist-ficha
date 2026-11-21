import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SLIDES, allMappedNames, IGNORED_FIELDS, THEME_TYPES } from '../src/fieldmap.js';

const fields = JSON.parse(readFileSync(new URL('../assets/fields.json', import.meta.url), 'utf8'));
const byName = Object.fromEntries(fields.map((f) => [f.name, f]));
const fieldsOf = (slide) => slide.groups.flatMap((g) => g.fields);

test('todo nome mapeado existe no PDF', () => {
  for (const n of allMappedNames()) assert.ok(byName[n], `campo inexistente: "${n}"`);
});

test('nenhum campo é mapeado duas vezes', () => {
  const names = allMappedNames();
  assert.equal(new Set(names).size, names.length);
});

test('mapeados + ignorados cobrem exatamente os 324 campos', () => {
  const all = [...allMappedNames(), ...IGNORED_FIELDS].sort();
  assert.deepEqual(all, fields.map((f) => f.name).sort());
});

test('ids dos slides de edição', () => {
  assert.deepEqual(SLIDES.map((s) => s.id), [
    'identidade', 'tema1', 'tema2', 'tema3', 'tema4', 'companhia', 'mochila', 'estados', 'promessa',
  ]);
});

test('cada tema tem grupo exclusivo Origem/Aventura/Grandeza com os checks do próprio cartão', () => {
  for (let c = 0; c < 4; c++) {
    const g = SLIDES[1 + c].groups.find((x) => x.exclusive);
    assert.ok(g, `tema${c + 1} sem grupo exclusivo`);
    assert.deepEqual(g.fields.map((f) => f.label), ['Origem', 'Aventura', 'Grandeza']);
    assert.ok(g.fields.every((f) => f.kind === 'check'));
    for (const f of g.fields) assert.ok(f.name.startsWith(`Theme Card ${c} `), f.name);
  }
});

test('irregularidades de nome do PDF resolvidas', () => {
  const names = (i) => fieldsOf(SLIDES[i]).map((f) => f.name);
  assert.ok(names(3).includes('Theme Card 2 Greatness1'));
  assert.ok(names(2).includes('Theme Card 0 Weakness Tag 3')); // 2ª fraqueza do Tema 2
  for (let c = 0; c < 4; c++) assert.ok(names(1 + c).includes(`Theme Card ${c}  Power Tag 3`));
});

test('cada tag de poder tem seu "riscada" na mesma linha (posição) e na mesma coluna', () => {
  for (let c = 0; c < 4; c++) {
    const fs = fieldsOf(SLIDES[1 + c]);
    for (let i = 0; i < 7; i++) {
      const tag = fs.find((f) => f.kind === 'text' && f.role === `power${i}`);
      const scr = fs.find((f) => f.kind === 'check' && f.role === `scratch${i}`);
      assert.ok(tag && scr, `tema${c + 1} linha ${i}: faltou tag ou riscada`);
      const t = byName[tag.name].rect, s = byName[scr.name].rect;
      assert.ok(Math.abs(t[1] - s[1]) < 4, `tema${c + 1} linha ${i}: riscada fora da linha`);
      assert.ok(s[0] > t[0] && s[0] - t[2] < 30, `tema${c + 1} linha ${i}: riscada fora da coluna`);
    }
  }
});

test('Companhia tem 8 tags, 2 fraquezas, 5 relações e 3 linhas de busca', () => {
  const fs = fieldsOf(SLIDES[5]);
  assert.equal(fs.filter((f) => /^Fellowship \d$/.test(f.name)).length, 8);
  assert.equal(fs.filter((f) => f.name.startsWith('Fellowship Weakness')).length, 2);
  assert.equal(fs.filter((f) => f.name.startsWith('Relationship')).length, 5);
  assert.equal(fs.filter((f) => /^Fellowship Quest \d$/.test(f.name)).length, 3);
});

test('THEME_TYPES tem as 4 categorias e 21 tipos', () => {
  assert.deepEqual(Object.keys(THEME_TYPES), ['Origem', 'Aventura', 'Grandeza', 'Variam']);
  assert.equal(Object.values(THEME_TYPES).flat().length, 7 + 6 + 4 + 3);
});

test('todo slide tem título e dica em português (não vazios)', () => {
  for (const s of SLIDES) { assert.ok(s.title.length > 2); assert.ok(s.hint.length > 10); }
});

// ---- novo visual: grupos mais finos e seções ----
const labelsOf = (id) => SLIDES.find((s) => s.id === id).groups.map((g) => g.label);
const QUEST = ['Busca', 'Marcos', 'Abandonar', 'Melhoria'];

test('rótulos de grupo por slide são os do plano e únicos', () => {
  const tema = ['Título do tema', 'Tipo de tema', 'Magnitude', 'Tags de poder', 'Tags de fraqueza', ...QUEST, 'Melhorias especiais'];
  const esperado = {
    identidade: ['Nome do personagem', 'Nome do jogador'],
    tema1: tema, tema2: tema, tema3: tema, tema4: tema,
    companhia: ['Relações', 'Tags da Companhia', 'Tags de fraqueza', ...QUEST, 'Melhorias especiais'],
    mochila: ['Tags de mochila', 'Quintessências'],
    estados: ['Estado 1', 'Estado 2', 'Estado 3', 'Estado 4', 'Notas adicionais'],
    promessa: ['Promessa', 'História', 'Notas'],
  };
  for (const [id, labels] of Object.entries(esperado)) {
    assert.deepEqual(labelsOf(id), labels, id);
    assert.equal(new Set(labelsOf(id)).size, labelsOf(id).length, `rótulo repetido em ${id}`);
  }
});

test('cada slide de edição tem section', () => {
  const sec = SLIDES.map((s) => s.section);
  assert.deepEqual(sec, ['personagem', 'temas', 'temas', 'temas', 'temas', 'detalhes', 'detalhes', 'detalhes', 'detalhes']);
});

test('notas dos Estados têm fold e o resto não', () => {
  const estados = SLIDES.find((s) => s.id === 'estados');
  const folded = estados.groups.flatMap((g) => g.fields).filter((f) => f.fold);
  assert.equal(folded.length, 12);
  assert.ok(folded.every((f) => /^Tag \d Note \d$/.test(f.name)));
  const outros = SLIDES.filter((s) => s.id !== 'estados').flatMap((s) => s.groups.flatMap((g) => g.fields));
  assert.ok(outros.every((f) => !f.fold));
});

test('"Título do tema" tem exatamente a tag de poder 1 e a sua riscada', () => {
  for (let c = 0; c < 4; c++) {
    const g = SLIDES[1 + c].groups.find((x) => x.label === 'Título do tema');
    assert.deepEqual(g.fields.map((f) => f.role), ['power0', 'scratch0']);
    const poder = SLIDES[1 + c].groups.find((x) => x.label === 'Tags de poder');
    assert.deepEqual(poder.fields.filter((f) => f.kind === 'text').map((f) => f.role), ['power1', 'power2', 'power3', 'power4', 'power5', 'power6']);
  }
});
