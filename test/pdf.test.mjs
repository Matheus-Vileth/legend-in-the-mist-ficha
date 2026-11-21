import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { fillSheet, toWinAnsi, sheetFileName } from '../src/pdf.js';

const pdfBytes = new Uint8Array(readFileSync(new URL('../assets/ficha.pdf', import.meta.url)));
const reload = async (bytes) => (await PDFDocument.load(bytes)).getForm();

test('fillSheet escreve texto com acentos em "Character Name"', async () => {
  const out = await fillSheet(pdfBytes, { 'Character Name': 'Thalía Éowyn Çevik' });
  assert.equal((await reload(out)).getTextField('Character Name').getText(), 'Thalía Éowyn Çevik');
});

test('fillSheet marca "Promise 0" e deixa "Promise 1" desmarcado', async () => {
  const form = await reload(await fillSheet(pdfBytes, { 'Promise 0': true }));
  assert.equal(form.getCheckBox('Promise 0').isChecked(), true);
  assert.equal(form.getCheckBox('Promise 1').isChecked(), false);
});

test('fillSheet escreve nos campos com nome irregular (dois espaços e Greatness1)', async () => {
  const form = await reload(
    await fillSheet(pdfBytes, { 'Theme Card 1  Power Tag 3': 'Espada', 'Theme Card 2 Greatness1': true }),
  );
  assert.equal(form.getTextField('Theme Card 1  Power Tag 3').getText(), 'Espada');
  assert.equal(form.getCheckBox('Theme Card 2 Greatness1').isChecked(), true);
});

test('fillSheet ignora nome de campo desconhecido', async () => {
  const out = await fillSheet(pdfBytes, { 'Campo Que Não Existe': 'x', 'Player Name': 'Ana' });
  assert.equal((await reload(out)).getTextField('Player Name').getText(), 'Ana');
});

test('fillSheet aceita texto de 5000 caracteres em "Notes 0" sem lançar', async () => {
  const out = await fillSheet(pdfBytes, { 'Notes 0': 'a'.repeat(5000) });
  assert.ok((await reload(out)).getTextField('Notes 0').getText().length > 0);
});

test('fillSheet aceita emoji e escrita fora do WinAnsi sem lançar', async () => {
  const out = await fillSheet(pdfBytes, { 'Character Name': 'Kai 🗡️ 勇者' });
  assert.match((await reload(out)).getTextField('Character Name').getText(), /^Kai \?+ \?+$/);
});

test('fillSheet com values vazio devolve PDF com 2 páginas e os 324 campos', async () => {
  const doc = await PDFDocument.load(await fillSheet(pdfBytes, {}));
  assert.equal(doc.getPageCount(), 2);
  assert.equal(doc.getForm().getFields().length, 324);
});

test('fillSheet mantém o PDF editável (não achata o formulário)', async () => {
  const out = await fillSheet(pdfBytes, { 'Character Name': 'Ana' });
  assert.ok((await reload(out)).getFields().length > 0);
});

test('toWinAnsi mantém acentos, aspas curvas e travessão; troca emoji por "?"', () => {
  assert.equal(toWinAnsi('ação “ok” — é'), 'ação “ok” — é');
  assert.ok(!toWinAnsi('espada 🗡️').includes('🗡'));
  assert.ok(toWinAnsi('espada 🗡️').includes('?'));
});

test('toWinAnsi troca quebras de linha e tabs por espaço', () => {
  assert.equal(toWinAnsi('a\nb\tc'), 'a b c');
});

test('sheetFileName usa kebab-case sem acento e tem fallback', () => {
  assert.equal(sheetFileName('Thalía Éowyn'), 'ficha-thalia-eowyn.pdf');
  assert.equal(sheetFileName(''), 'ficha-sem-nome.pdf');
  assert.equal(sheetFileName(undefined), 'ficha-sem-nome.pdf');
  assert.equal(sheetFileName('🗡️🗡️'), 'ficha-sem-nome.pdf');
});

test('fillSheet ignora o retrato (data URL guardada no estado) sem lançar', async () => {
  const out = await fillSheet(pdfBytes, { Retrato: 'data:image/jpeg;base64,AAAA', 'Character Name': 'Ana' });
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 2);
  assert.equal(doc.getForm().getTextField('Character Name').getText(), 'Ana');
});
