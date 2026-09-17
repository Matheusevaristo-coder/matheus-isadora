import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/gifts.js';
import { gifts } from '../src/content.js';
const response = () => ({ code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
test('catálogo tem 24 presentes distintos com links HTTPS e lojas corretas', () => {
  assert.equal(gifts.length, 24);
  assert.equal(new Set(gifts.map(g => g.id)).size, 24);
  for (const gift of gifts) assert.equal(new URL(gift.url).protocol, 'https:');
  assert.equal(gifts.find(g => g.id === 'faqueiro').store, 'Mercado Livre');
  assert.equal(gifts.find(g => g.id === 'diamond').url, 'https://s.shopee.com.br/6L4PgkGNJn?share_channel_code=1');
});
test('reserva rejeita métodos, IDs e dados inválidos', async () => {
  const badMethod = response(); await handler({ method: 'DELETE' }, badMethod); assert.equal(badMethod.code, 405);
  const invalid = response(); await handler({ method: 'POST', headers: { 'content-type': 'application/json' }, body: { id: '../other', name: 'Teste', phone: '21999999999' } }, invalid); assert.equal(invalid.code, 400);
});
test('sem configuração não anuncia disponibilidade nem confirma reserva', async () => {
  const keys = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
  const saved = keys.map(key => process.env[key]); keys.forEach(key => delete process.env[key]);
  try {
    for (const method of ['GET', 'POST']) {
      const res = response();
      await handler({ method, headers: { 'content-type': 'application/json' }, body: { id: gifts[0].id, name: 'Pessoa teste', phone: '21999999999' } }, res);
      assert.equal(res.code, 503); assert.equal(res.body.ok, undefined); assert.equal(res.body.reserved, undefined);
    }
  } finally { keys.forEach((key, i) => saved[i] === undefined ? delete process.env[key] : process.env[key] = saved[i]); }
});
