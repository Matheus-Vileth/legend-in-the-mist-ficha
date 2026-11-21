// Retrato do personagem: regras puras (tipos aceitos, tamanho, validação do que fica salvo).
// O retrato é guardado como data URL em state.values[PORTRAIT_KEY] (vai no save .json); não é um campo do PDF.

export const PORTRAIT_KEY = 'Retrato';
export const MAX_SIDE = 640;                    // maior lado, em pixels, depois de reduzido
export const MAX_FILE_BYTES = 20 * 1024 * 1024; // arquivo de entrada: até 20 MB
export const MAX_STORED_CHARS = 3_000_000;      // data URL guardada: até ~3 MB de texto

const IMAGE_TYPES = /^image\/(png|jpe?g|webp|gif|bmp)$/i; // svg fica de fora de propósito

export function isImageType(type) {
  return typeof type === 'string' && IMAGE_TYPES.test(type);
}

/** Reduz mantendo a proporção até caber em `max`; não amplia. null se as dimensões forem inválidas. */
export function fitWithin(w, h, max) {
  if (![w, h, max].every((n) => Number.isFinite(n) && n > 0)) return null;
  const scale = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}

/** Só aceita data URL de imagem raster em base64 e de tamanho razoável (um save importado não pode apontar para fora). */
export function isPortraitDataUrl(v) {
  return typeof v === 'string' && v.length <= MAX_STORED_CHARS && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v);
}
