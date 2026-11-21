import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOTAL_SLIDES, clampSlide, nextSlide, prevSlide } from '../src/carousel.js';
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
