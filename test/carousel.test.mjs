import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TOTAL_SLIDES, clampSlide, nextSlide, prevSlide, SECTION_LABELS, sectionOf, firstSlideOf, stepLabel, slideTitle,
} from '../src/carousel.js';
import { SLIDES } from '../src/fieldmap.js';

test('TOTAL_SLIDES = slides de edição + 1 (revisão e download)', () => {
  assert.equal(TOTAL_SLIDES, SLIDES.length + 1);
  assert.equal(TOTAL_SLIDES, 10);
});

test('clampSlide limita ao intervalo e trata não-inteiros', () => {
  assert.equal(clampSlide(-3), 0);
  assert.equal(clampSlide(99), 9);
  assert.equal(clampSlide(NaN), 0);
  assert.equal(clampSlide(2.5), 0);
  assert.equal(clampSlide('3'), 0);
  assert.equal(clampSlide(4), 4);
});

test('nextSlide avança e trava no último', () => {
  assert.equal(nextSlide(3), 4);
  assert.equal(nextSlide(9), 9);
});

test('prevSlide recua e trava no primeiro', () => {
  assert.equal(prevSlide(3), 2);
  assert.equal(prevSlide(0), 0);
});

test('sectionOf devolve a seção de cada passo', () => {
  assert.deepEqual([0, 1, 4, 5, 8, 9].map(sectionOf), ['personagem', 'temas', 'temas', 'detalhes', 'detalhes', 'exportar']);
});

test('SECTION_LABELS em português', () => {
  assert.deepEqual(SECTION_LABELS, { personagem: 'Personagem', temas: 'Temas', detalhes: 'Detalhes', exportar: 'Exportar' });
});

test('firstSlideOf leva ao primeiro passo da seção', () => {
  assert.deepEqual(['personagem', 'temas', 'detalhes', 'exportar'].map(firstSlideOf), [0, 1, 5, 9]);
});

test('stepLabel monta "Passo N de 10 · Seção"', () => {
  assert.equal(stepLabel(0), 'Passo 1 de 10 · Personagem');
  assert.equal(stepLabel(2), 'Passo 3 de 10 · Temas');
  assert.equal(stepLabel(9), 'Passo 10 de 10 · Exportar');
});

test('slideTitle devolve o título do slide e "Revisão e download" no último', () => {
  assert.equal(slideTitle(0), 'Identidade');
  assert.equal(slideTitle(2), 'Tema 2');
  assert.equal(slideTitle(9), 'Revisão e download');
});
