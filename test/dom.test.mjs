import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventName } from '../src/dom.js';

test('eventName converte props onX do helper no nome de evento do DOM (minúsculo)', () => {
  assert.equal(eventName('onInput'), 'input');
  assert.equal(eventName('onChange'), 'change');
  assert.equal(eventName('onClick'), 'click');
});

test('eventName devolve null para props que não são de evento', () => {
  assert.equal(eventName('class'), null);
  assert.equal(eventName('once'), null);
  assert.equal(eventName('onion'), null);
});
