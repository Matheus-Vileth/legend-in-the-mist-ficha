// Navegação do carrossel: 9 slides de edição + 1 de revisão/download, agrupados em seções (abas).
import { SLIDES } from './fieldmap.js';

export const TOTAL_SLIDES = SLIDES.length + 1;
export const SECTION_LABELS = { personagem: 'Personagem', temas: 'Temas', detalhes: 'Detalhes', exportar: 'Exportar' };
const REVIEW_TITLE = 'Revisão e download';

export function clampSlide(i) {
  if (!Number.isInteger(i)) return 0;
  return Math.min(Math.max(i, 0), TOTAL_SLIDES - 1);
}

export const nextSlide = (i) => clampSlide(i + 1);
export const prevSlide = (i) => clampSlide(i - 1);

export function sectionOf(i) {
  const k = clampSlide(i);
  return k < SLIDES.length ? SLIDES[k].section : 'exportar';
}

export function firstSlideOf(section) {
  if (section === 'exportar') return TOTAL_SLIDES - 1;
  const i = SLIDES.findIndex((s) => s.section === section);
  return i < 0 ? 0 : i;
}

export function slideTitle(i) {
  const k = clampSlide(i);
  return k < SLIDES.length ? SLIDES[k].title : REVIEW_TITLE;
}

export function stepLabel(i) {
  const k = clampSlide(i);
  return `Passo ${k + 1} de ${TOTAL_SLIDES} · ${SECTION_LABELS[sectionOf(k)]}`;
}

/** Id do slide (chave do conteúdo do guia); o último passo é a revisão. */
export function slideIdAt(i) {
  const k = clampSlide(i);
  return k < SLIDES.length ? SLIDES[k].id : 'revisao';
}
