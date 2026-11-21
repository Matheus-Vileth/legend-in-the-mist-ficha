// Retrato do personagem: área clicável que também aceita arrastar uma imagem; a foto aparece atrás das vinhas da moldura.
import { h, img } from './ui.js';
import { setValue } from './state.js';
import { PORTRAIT_KEY, MAX_SIDE, MAX_FILE_BYTES, isImageType, fitWithin, isPortraitDataUrl } from './portrait.js';

async function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file); } catch { /* cai no <img> */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const el = new Image();
    el.src = url;
    await el.decode();
    return el;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Reduz a imagem (maior lado MAX_SIDE) e devolve um data URL JPEG. */
async function toDataUrl(file) {
  const bmp = await loadBitmap(file);
  const w = bmp.width ?? bmp.naturalWidth;
  const hgt = bmp.height ?? bmp.naturalHeight;
  const size = fitWithin(w, hgt, MAX_SIDE);
  if (!size) throw new Error('Não foi possível ler as dimensões da imagem.');
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  const g = canvas.getContext('2d');
  g.fillStyle = '#ecd9b0'; // PNG/WebP com transparência ganham o fundo de pergaminho
  g.fillRect(0, 0, size.w, size.h);
  g.imageSmoothingQuality = 'high';
  g.drawImage(bmp, 0, 0, size.w, size.h);
  const url = canvas.toDataURL('image/jpeg', 0.88);
  if (!isPortraitDataUrl(url)) throw new Error('A imagem ficou grande demais depois de reduzida. Tente uma menor.');
  return url;
}

/** Sem isso, soltar uma imagem fora da área faria o navegador abrir o arquivo e sair da ficha. */
export function guardWindowDrops() {
  const hasFiles = (e) => [...(e.dataTransfer?.types ?? [])].includes('Files');
  for (const type of ['dragover', 'drop']) window.addEventListener(type, (e) => { if (hasFiles(e)) e.preventDefault(); });
}

/** ctx = { getState(), commit(next) } */
export function renderPortrait(ctx) {
  const HINT_EMPTY = 'Clique ou arraste uma imagem';
  const HINT_FULL = 'Trocar imagem';
  const HINT_DROP = 'Solte a imagem aqui';

  const input = h('input', {
    type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/bmp', hidden: true,
    onChange: (e) => { const file = e.target.files[0]; e.target.value = ''; if (file) accept(file); },
  });
  const photo = h('img', { class: 'portrait-photo', alt: 'Retrato do personagem' });
  const hint = h('span', { class: 'portrait-hint' }, HINT_EMPTY);
  const zone = h('div', {
    class: 'portrait-zone', role: 'button', tabIndex: 0, 'aria-label': 'Escolher a imagem do retrato do personagem',
    onClick: () => input.click(),
    onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } },
  },
  photo,
  img('moldura-retrato', { class: 'portrait-frame' }),
  img('moldura-paisagem', { class: 'portrait-empty' }),
  hint);
  const msg = h('p', { class: 'cap portrait-msg', role: 'status' }, 'Retrato do personagem');
  const swap = h('button', { type: 'button', class: 'btn ghost', onClick: () => input.click() }, 'Trocar imagem');
  const remove = h('button', {
    type: 'button', class: 'btn ghost',
    onClick: () => { ctx.commit(setValue(ctx.getState(), PORTRAIT_KEY, '')); paint(); say('Retrato removido.'); },
  }, 'Remover');
  const actions = h('div', { class: 'portrait-actions' }, swap, remove);

  const say = (text, error = false) => { msg.textContent = text; msg.classList.toggle('err', error); };
  const paint = () => {
    const value = ctx.getState().values[PORTRAIT_KEY];
    const has = isPortraitDataUrl(value);
    zone.classList.toggle('has-photo', has);
    if (has) photo.src = value; else photo.removeAttribute('src');
    actions.hidden = !has;
    hint.textContent = has ? HINT_FULL : HINT_EMPTY;
  };

  async function accept(file) {
    if (!isImageType(file.type)) { say('Esse arquivo não é uma imagem. Use PNG, JPG, WebP, GIF ou BMP.', true); return; }
    if (file.size > MAX_FILE_BYTES) { say('Imagem grande demais (máximo 20 MB).', true); return; }
    say('Carregando…');
    try {
      ctx.commit(setValue(ctx.getState(), PORTRAIT_KEY, await toDataUrl(file)));
      paint();
      say('Retrato atualizado.');
    } catch (e) {
      say(e.message || 'Não foi possível ler essa imagem.', true);
    }
  }

  // arrastar e soltar
  let depth = 0; // dragenter/dragleave disparam também para os filhos
  const hasFiles = (e) => [...(e.dataTransfer?.types ?? [])].includes('Files');
  const endDrag = () => { depth = 0; zone.classList.remove('drag'); paint(); };
  zone.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; e.preventDefault(); depth++; zone.classList.add('drag'); hint.textContent = HINT_DROP; });
  zone.addEventListener('dragover', (e) => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  zone.addEventListener('dragleave', () => { if (--depth <= 0) endDrag(); });
  zone.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    endDrag();
    if (file) accept(file);
  });

  paint();
  return h('div', { class: 'portrait' }, zone, actions, msg, input);
}
