// Preenche o PDF oficial com pdf-lib. Os valores usam o nome exato do campo do PDF como chave.
import { PDFDocument, StandardFonts } from 'pdf-lib';

// Pontos de código 0x80-0x9F que existem no WinAnsi (cp1252), fora do bloco Latin-1.
const CP1252_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');
const MAX_TEXT = 500; // limite por campo: o save .json guarda tudo; o PDF só precisa do que cabe.

function encodable(ch) {
  const cp = ch.codePointAt(0);
  return (cp >= 0x20 && cp <= 0x7e) || (cp >= 0xa0 && cp <= 0xff) || CP1252_EXTRA.has(ch);
}

/** Troca por "?" o que a fonte Helvetica/WinAnsi não codifica; quebras de linha e tabs viram espaço. */
export function toWinAnsi(text) {
  let out = '';
  for (const ch of String(text)) {
    if (ch === '\n' || ch === '\r' || ch === '\t') out += ' ';
    else out += encodable(ch) ? ch : '?';
  }
  return out;
}

export function sheetFileName(characterName) {
  const slug = String(characterName ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `ficha-${slug}.pdf` : 'ficha-sem-nome.pdf';
}

export async function fillSheet(pdfBytes, values) {
  const doc = await PDFDocument.load(pdfBytes);
  const form = doc.getForm();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const byName = new Map(form.getFields().map((f) => [f.getName(), f]));

  for (const [name, value] of Object.entries(values)) {
    const field = byName.get(name);
    if (!field) continue;
    if (typeof value === 'boolean' || value === true) {
      if (typeof field.check === 'function') (value ? field.check() : field.uncheck());
    } else if (typeof field.setText === 'function') {
      let text = toWinAnsi(value).slice(0, MAX_TEXT);
      const max = field.getMaxLength?.();
      if (max != null) text = text.slice(0, max);
      field.setText(text);
    }
  }
  form.updateFieldAppearances(font);
  return doc.save();
}
