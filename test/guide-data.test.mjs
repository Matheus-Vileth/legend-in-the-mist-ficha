import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GLOSSARY, TIPS } from '../src/guide-data.js';
import { SLIDES } from '../src/fieldmap.js';
import { norm } from '../src/text.js';

const PASSOS = [...SLIDES.map((s) => s.id), 'revisao'];
const OBRIGATORIOS = [
  'heroi', 'tema', 'magnitude', 'origem', 'aventura', 'grandeza', 'tipo-de-tema', 'tag', 'tag-de-poder', 'tag-de-fraqueza',
  'titulo-do-tema', 'busca', 'marco', 'abandonar', 'melhoria', 'melhoria-especial', 'companhia', 'relacao', 'mochila',
  'quintessencia', 'promessa', 'momento-de-realizacao', 'narrador', 'poder', 'riscar', 'queimar-tag', 'tag-de-historia',
  'estado', 'nivel', 'acampar', 'ameaca', 'consequencia',
];

test('TIPS tem exatamente as chaves dos passos (os 9 slides de edição e a revisão)', () => {
  assert.deepEqual(Object.keys(TIPS).sort(), [...PASSOS].sort());
});

test('todo passo tem de 2 a 3 dicas', () => {
  for (const id of PASSOS) assert.ok(TIPS[id].length >= 2 && TIPS[id].length <= 3, `${id}: ${TIPS[id].length} dicas`);
});

test('cada dica tem até 200 caracteres e não tem HTML', () => {
  for (const [id, dicas] of Object.entries(TIPS)) {
    for (const d of dicas) {
      assert.ok(typeof d === 'string' && d.trim().length > 10, `${id}: dica vazia`);
      assert.ok(d.length <= 200, `${id}: ${d.length} caracteres — "${d.slice(0, 40)}…"`);
      assert.ok(!/[<>]/.test(d), `${id}: tem < ou >`);
    }
  }
});

test('os termos obrigatórios existem (32)', () => {
  const ids = GLOSSARY.map((t) => t.id);
  for (const id of OBRIGATORIOS) assert.ok(ids.includes(id), `falta o termo "${id}"`);
  assert.ok(GLOSSARY.length >= 32);
});

test('cada termo tem id, pt, en e curto preenchidos', () => {
  for (const t of GLOSSARY) {
    for (const k of ['id', 'pt', 'en', 'curto']) assert.ok(typeof t[k] === 'string' && t[k].trim(), `${t.id}: falta ${k}`);
  }
});

test('curto tem até 260 caracteres e não tem HTML', () => {
  for (const t of GLOSSARY) {
    assert.ok(t.curto.length <= 260, `${t.id}: ${t.curto.length} caracteres`);
    assert.ok(!/[<>]/.test(t.curto), `${t.id}: tem < ou >`);
  }
});

test('ids são únicos e em kebab-case sem acento', () => {
  const ids = GLOSSARY.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z]+(-[a-z]+)*$/, id);
});

test('nomes (pt e apelidos) são únicos entre os termos, para um nome nunca apontar para dois termos', () => {
  const dono = new Map();
  for (const t of GLOSSARY) {
    for (const nome of [t.pt, ...(t.apelidos ?? [])].map(norm)) {
      assert.ok(!dono.has(nome) || dono.get(nome) === t.id, `"${nome}" aparece em ${dono.get(nome)} e em ${t.id}`);
      dono.set(nome, t.id);
    }
  }
});

test('pagina, quando existe, é um inteiro positivo', () => {
  for (const t of GLOSSARY) if ('pagina' in t) assert.ok(Number.isInteger(t.pagina) && t.pagina > 0, `${t.id}: pagina ${t.pagina}`);
});

test('as páginas citadas são as conferidas no livro', () => {
  const esperado = {
    tema: 74, 'tipo-de-tema': 79, tag: 76, 'tag-de-poder': 76, 'tag-de-fraqueza': 76, riscar: 76, mochila: 76, abandonar: 75,
    magnitude: 171, marco: 187, melhoria: 187, busca: 188, companhia: 138, relacao: 138, promessa: 193, 'momento-de-realizacao': 193,
    poder: 152, 'queimar-tag': 158, 'tag-de-historia': 164, estado: 166, nivel: 166, acampar: 179, ameaca: 147, consequencia: 160,
  };
  for (const [id, p] of Object.entries(esperado)) assert.equal(GLOSSARY.find((t) => t.id === id)?.pagina, p, id);
});

test('todo tipo de tema do campo "Tipo de tema" tem explicação e página', async () => {
  const { THEME_TYPES } = await import('../src/fieldmap.js');
  const { TYPE_INFO } = await import('../src/guide-data.js');
  for (const nome of Object.values(THEME_TYPES).flat()) {
    const i = TYPE_INFO[nome];
    assert.ok(i && i.texto.length > 10 && i.texto.length <= 160, `${nome}: texto`);
    assert.ok(Number.isInteger(i.pagina) && i.pagina > 0, `${nome}: pagina`);
  }
});
