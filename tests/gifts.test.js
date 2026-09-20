import test from 'node:test';
import assert from 'node:assert/strict';
import { gifts } from '../src/content.js';
import { mergeGiftCatalog, visibleGiftCatalog } from '../src/catalog.js';
test('catálogo tem 29 presentes distintos, numerados e com links HTTPS', () => {
  assert.equal(gifts.length, 29);
  assert.equal(new Set(gifts.map(g => g.id)).size, 29);
  assert.deepEqual(gifts.map(g => g.number), Array.from({ length: 29 }, (_, index) => index + 1));
  for (const gift of gifts) assert.equal(new URL(gift.url).protocol, 'https:');
  assert.equal(gifts.find(g => g.id === 'faqueiro').store, 'Mercado Livre');
  assert.equal(gifts.find(g => g.id === 'diamond').url, 'https://s.shopee.com.br/6L4PgkGNJn?share_channel_code=1');
  assert.equal(gifts.find(g => g.id === 'toalhas-roseli').store, 'Riachuelo');
});
test('combina edições, novos itens e visibilidade do catálogo administrativo', () => {
  const overrides = [
    { id: 'varal', number: 1, name: 'Varal atualizado', active: false, deleted: false },
    { id: 'puffs', number: 2, name: 'Puffs editados', active: true, deleted: false },
    { id: 'novo-presente', number: 30, name: 'Novo presente', category: 'À mesa', description: '', url: 'https://example.com', store: 'Loja', price: 0, maxPrice: 0, active: true, deleted: false },
  ];
  const merged = mergeGiftCatalog(overrides);
  assert.equal(merged.find(item => item.id === 'puffs').name, 'Puffs editados');
  assert.equal(merged.at(-1).id, 'novo-presente');
  assert.equal(visibleGiftCatalog(overrides).some(item => item.id === 'varal'), false);
});
