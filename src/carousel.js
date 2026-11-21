// Navegação do carrossel: 9 slides de edição + 1 de revisão/download.
import { SLIDES } from './fieldmap.js';

export const TOTAL_SLIDES = SLIDES.length + 1;

export function clampSlide(i) {
  if (!Number.isInteger(i)) return 0;
  return Math.min(Math.max(i, 0), TOTAL_SLIDES - 1);
}

export const nextSlide = (i) => clampSlide(i + 1);
export const prevSlide = (i) => clampSlide(i - 1);
