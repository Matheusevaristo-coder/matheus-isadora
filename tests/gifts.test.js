import test from 'node:test';
import assert from 'node:assert/strict';
import { gifts } from '../src/content.js';
test('catálogo tem 29 presentes distintos, numerados e com links HTTPS', () => {
  assert.equal(gifts.length, 29);
  assert.equal(new Set(gifts.map(g => g.id)).size, 29);
  assert.deepEqual(gifts.map(g => g.number), Array.from({ length: 29 }, (_, index) => index + 1));
  for (const gift of gifts) assert.equal(new URL(gift.url).protocol, 'https:');
  assert.equal(gifts.find(g => g.id === 'faqueiro').store, 'Mercado Livre');
  assert.equal(gifts.find(g => g.id === 'diamond').url, 'https://s.shopee.com.br/6L4PgkGNJn?share_channel_code=1');
  assert.equal(gifts.find(g => g.id === 'toalhas-roseli').store, 'Riachuelo');
});
