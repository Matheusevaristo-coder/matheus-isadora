import test from 'node:test';
import assert from 'node:assert/strict';
import { gifts } from '../src/content.js';
test('catálogo tem 24 presentes distintos com links HTTPS e lojas corretas', () => {
  assert.equal(gifts.length, 24);
  assert.equal(new Set(gifts.map(g => g.id)).size, 24);
  for (const gift of gifts) assert.equal(new URL(gift.url).protocol, 'https:');
  assert.equal(gifts.find(g => g.id === 'faqueiro').store, 'Mercado Livre');
  assert.equal(gifts.find(g => g.id === 'diamond').url, 'https://s.shopee.com.br/6L4PgkGNJn?share_channel_code=1');
});
