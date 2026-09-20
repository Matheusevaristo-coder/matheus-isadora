import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRsvp } from '../server/validation.js';
const valid = { name: ' Ana Silva ', phone: '(21) 99999-1234', attendance: 'yes', guests: 2, message: 'Até lá!' };
test('normaliza dados e não aceita campos arbitrários', () => { const value = validateRsvp({ ...valid, admin: true }); assert.equal(value.name, 'Ana Silva'); assert.equal(value.phone, '21999991234'); assert.equal(value.admin, undefined); });
test('bloqueia entradas inválidas e automação simples', () => { for (const change of [{ name: ' ' }, { phone: '123' }, { guests: 0 }, { guests: 5 }, { guests: 1.5 }, { guests: '2' }, { attendance: 'maybe' }, { message: 'x'.repeat(501) }, { website: 'spam' }]) assert.throws(() => validateRsvp({ ...valid, ...change })); });
test('ausência exige zero participantes', () => { assert.equal(validateRsvp({ ...valid, attendance: 'no', guests: 0 }).guests, 0); assert.throws(() => validateRsvp({ ...valid, attendance: 'no' })); });
