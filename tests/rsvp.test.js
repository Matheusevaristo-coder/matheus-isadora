import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRsvp } from '../server/validation.js';
import handler from '../api/rsvp.js';
const valid = { name: ' Ana Silva ', phone: '(21) 99999-1234', attendance: 'yes', guests: 2, message: 'Até lá!' };
test('normaliza dados e não aceita campos arbitrários', () => { const value = validateRsvp({ ...valid, admin: true }); assert.equal(value.name, 'Ana Silva'); assert.equal(value.phone, '21999991234'); assert.equal(value.admin, undefined); });
test('bloqueia entradas inválidas e automação simples', () => { for (const change of [{ name: ' ' }, { phone: '123' }, { guests: 0 }, { guests: 7 }, { guests: 1.5 }, { guests: '2' }, { attendance: 'maybe' }, { message: 'x'.repeat(501) }, { website: 'spam' }]) assert.throws(() => validateRsvp({ ...valid, ...change })); });
test('ausência exige zero participantes', () => { assert.equal(validateRsvp({ ...valid, attendance: 'no', guests: 0 }).guests, 0); assert.throws(() => validateRsvp({ ...valid, attendance: 'no' })); });
function response() { return { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
test('API rejeita leitura e formato incorreto', async () => { const a = response(); await handler({ method: 'GET' }, a); assert.equal(a.code, 405); const b = response(); await handler({ method: 'POST', headers: {} }, b); assert.equal(b.code, 415); });
test('API nunca finge sucesso quando Firebase não está configurado', async () => { const backup = process.env.FIREBASE_PROJECT_ID; delete process.env.FIREBASE_PROJECT_ID; try { const res = response(); await handler({ method: 'POST', headers: { 'content-type': 'application/json' }, body: valid }, res); assert.equal(res.code, 503); assert.equal(res.body.ok, undefined); } finally { if (backup) process.env.FIREBASE_PROJECT_ID = backup; } });
