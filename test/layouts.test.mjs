import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LAYOUTS } from '../src/layouts.js';
import { SLIDES } from '../src/fieldmap.js';

function walk(blocks, fn) {
  for (const b of blocks) {
    fn(b);
    if (b.kind === 'cols') b.cols.forEach((c) => walk(c, fn));
    if (b.kind === 'grid') walk(b.blocks, fn);
  }
}
const usedGroups = (layout) => {
  const out = [];
  walk(layout.blocks, (b) => { if (b.groups) out.push(...b.groups); });
  return out;
};

test('LAYOUTS tem uma entrada por slide, na mesma ordem de chaves', () => {
  assert.deepEqual(Object.keys(LAYOUTS).sort(), SLIDES.map((s) => s.id).sort());
});

test('cada rótulo de grupo de cada slide aparece exatamente uma vez no layout', () => {
  for (const s of SLIDES) {
    const usados = usedGroups(LAYOUTS[s.id]).sort();
    assert.deepEqual(usados, s.groups.map((g) => g.label).sort(), s.id);
  }
});

test('todo bloco tem título (exceto cols e grid) e tipo conhecido', () => {
  const tipos = new Set(['hero', 'card', 'sub', 'details', 'cols', 'grid']);
  for (const s of SLIDES) {
    walk(LAYOUTS[s.id].blocks, (b) => {
      assert.ok(tipos.has(b.kind), `${s.id}: tipo ${b.kind}`);
      if (b.kind !== 'cols' && b.kind !== 'grid') assert.ok(b.title && b.groups.length > 0, `${s.id}: bloco sem título/grupos`);
    });
  }
});

test('colunas usam a proporção 3fr 2fr', () => {
  for (const s of SLIDES) walk(LAYOUTS[s.id].blocks, (b) => { if (b.kind === 'cols') assert.equal(b.ratio, '3fr 2fr', s.id); });
});

test('temas: hero "Identidade do tema" em duas colunas, Tags de poder à esquerda, fraquezas e Busca à direita', () => {
  for (const id of ['tema1', 'tema2', 'tema3', 'tema4']) {
    const [hero, cols, extra] = LAYOUTS[id].blocks;
    assert.equal(hero.kind, 'hero');
    assert.equal(hero.title, 'Identidade do tema');
    assert.equal(hero.split, true);
    assert.deepEqual(hero.groups, ['Título do tema', 'Tipo de tema', 'Magnitude']);
    assert.equal(cols.kind, 'cols');
    assert.deepEqual(cols.cols[0].map((b) => b.title), ['Tags de poder']);
    assert.deepEqual(cols.cols[1].map((b) => b.title), ['Tags de fraqueza', 'Busca']);
    assert.equal(cols.cols[1][0].tone, 'weak');
    assert.deepEqual(cols.cols[1][1].groups, ['Busca', 'Abandonar', 'Melhoria', 'Marcos']);
    assert.equal(extra.kind, 'details');
    assert.equal(extra.title, 'Melhorias especiais');
  }
});

test('identidade tem a decoração de paisagem; os outros slides não', () => {
  assert.equal(LAYOUTS.identidade.decor, 'paisagem');
  for (const s of SLIDES.filter((x) => x.id !== 'identidade')) assert.equal(LAYOUTS[s.id].decor, undefined);
});

test('estados: grade de 4 cartões e Notas adicionais; promessa: Promessa em destaque', () => {
  const [grade, notas] = LAYOUTS.estados.blocks;
  assert.equal(grade.kind, 'grid');
  assert.deepEqual(grade.blocks.map((b) => b.title), ['Estado 1', 'Estado 2', 'Estado 3', 'Estado 4']);
  assert.equal(notas.title, 'Notas adicionais');
  const [prom, cols] = LAYOUTS.promessa.blocks;
  assert.equal(prom.emphasis, true);
  assert.deepEqual(cols.cols.flat().map((b) => b.kind), ['card', 'details']);
});
