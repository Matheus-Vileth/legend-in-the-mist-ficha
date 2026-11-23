// Preenche o PDF oficial com pdf-lib. Os valores usam o nome exato do campo do PDF como chave.
import { PDFDocument, StandardFonts, pushGraphicsState, popGraphicsState, rectangle, clip, endPath } from 'pdf-lib';
import { PORTRAIT_KEY } from './portrait.js';

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

// Área do retrato na 2ª página da ficha oficial (a mesma do campo "Character Portrait" da versão oficial com campo de imagem).
export const PORTRAIT_RECT = { x: 297.875, y: 356, width: 293.25, height: 393.625 };

/** "data:image/...;base64,..." -> { mime, bytes }; null se não for uma imagem em base64. */
export function dataUrlParts(url) {
  const m = /^data:(image\/[a-z+.-]+);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(typeof url === 'string' ? url : '');
  if (!m) return null;
  return { mime: m[1].toLowerCase(), bytes: Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0)) };
}

/** Retângulo para desenhar a imagem cobrindo a moldura inteira, sem distorcer e centralizada (o que sobra é cortado), como na tela. */
export function coverRect(imgW, imgH, frame) {
  const scale = Math.max(frame.width / imgW, frame.height / imgH);
  const width = imgW * scale;
  const height = imgH * scale;
  return { x: frame.x + (frame.width - width) / 2, y: frame.y + (frame.height - height) / 2, width, height };
}

/** pdf-lib só lê JPEG e PNG; WebP (de um save importado) é convertido pelo navegador. Devolve null se não der. */
async function embedPortrait(doc, url) {
  const parts = dataUrlParts(url);
  if (!parts) return null;
  try {
    if (parts.mime === 'image/jpeg' || parts.mime === 'image/jpg') return await doc.embedJpg(parts.bytes);
    if (parts.mime === 'image/png') return await doc.embedPng(parts.bytes);
    if (parts.mime === 'image/webp' && typeof document !== 'undefined') {
      const img = new Image();
      img.src = url;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      return await doc.embedPng(dataUrlParts(canvas.toDataURL('image/png')).bytes);
    }
  } catch {
    /* imagem ilegível: a ficha sai sem retrato */
  }
  return null;
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

  const photo = await embedPortrait(doc, values[PORTRAIT_KEY]);
  if (photo) {
    const page = doc.getPage(1); // o quadro "Portrait" fica na 2ª página
    const f = PORTRAIT_RECT;
    const r = coverRect(photo.width, photo.height, f);
    page.pushOperators(pushGraphicsState(), rectangle(f.x, f.y, f.width, f.height), clip(), endPath());
    page.drawImage(photo, r);
    page.pushOperators(popGraphicsState());
  }
  return doc.save();
}
