// Lê assets/ficha.pdf e grava assets/fields.json com nome, tipo, página e retângulo de cada campo.
import { readFileSync, writeFileSync } from 'node:fs';
import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib';

const root = new URL('../', import.meta.url);
const doc = await PDFDocument.load(readFileSync(new URL('assets/ficha.pdf', root)));
const pages = doc.getPages();
const pageIndexOf = (widget) => {
  const ref = widget.P();
  const i = pages.findIndex((p) => p.ref === ref);
  return i < 0 ? 0 : i;
};

const out = [];
for (const field of doc.getForm().getFields()) {
  const type = field instanceof PDFTextField ? 'text' : field instanceof PDFCheckBox ? 'check' : null;
  if (!type) throw new Error(`Tipo de campo não suportado: ${field.getName()}`);
  const widget = field.acroField.getWidgets()[0];
  const r = widget.getRectangle();
  out.push({
    name: field.getName(),
    type,
    page: pageIndexOf(widget),
    rect: [r.x, r.y, r.x + r.width, r.y + r.height].map((n) => Math.round(n * 10) / 10),
  });
}
out.sort((a, b) => a.page - b.page || b.rect[1] - a.rect[1] || a.rect[0] - b.rect[0]);
writeFileSync(new URL('assets/fields.json', root), JSON.stringify(out, null, 1));
console.log(`${out.length} campos gravados`);
