import fs from 'node:fs';
import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, collection, query, limit, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { gifts } from '../src/content.js';
let env;
before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-matheus-isadora', firestore: { rules: fs.readFileSync('firestore.rules','utf8') } }); });
after(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });
const contact = uid => ({ uid, name: 'Pessoa Teste', phone: '21999999999', createdAt: serverTimestamp() });
function reserve(db, uid, id = 'varal', extra = {}, statusExtra = {}) {
  const batch = writeBatch(db);
  batch.set(doc(db,'giftStatus',id), { reserved: true, createdAt: serverTimestamp(), ...statusExtra });
  batch.set(doc(db,'giftReservations',id), { ...contact(uid), ...extra });
  return batch.commit();
}
const rsvp = uid => ({ ...contact(uid), attendance: 'yes', guests: 2, message: '' });
test('permite todos os presentes do catálogo e consulta usada pelo site', async () => {
  const db = env.authenticatedContext('alice').firestore();
  for (const gift of gifts) await assertSucceeds(reserve(db,'alice',gift.id));
  const snapshot = await assertSucceeds(getDocs(query(collection(db,'giftStatus'),limit(24))));
  assert.equal(snapshot.size,24);
  for (const item of snapshot.docs) assert.deepEqual(Object.keys(item.data()).sort(), ['createdAt','reserved']);
});
test('apenas uma de duas reservas concorrentes vence', async () => {
  const result = await Promise.allSettled(['alice','bob'].map(uid => reserve(env.authenticatedContext(uid).firestore(),uid)));
  assert.equal(result.filter(item => item.status === 'fulfilled').length,1);
  assert.equal(result.filter(item => item.status === 'rejected').length,1);
});
test('nega acesso sem autenticação e leitura de dados privados', async () => {
  const alice = env.authenticatedContext('alice').firestore();
  const bob = env.authenticatedContext('bob').firestore();
  const anon = env.unauthenticatedContext().firestore();
  await assertSucceeds(reserve(alice,'alice'));
  await assertFails(getDocs(query(collection(anon,'giftStatus'),limit(24))));
  await assertFails(reserve(anon,'alice','puffs'));
  for (const db of [alice,bob,anon]) {
    await assertFails(getDoc(doc(db,'giftReservations','varal')));
    await assertFails(getDocs(collection(db,'giftReservations')));
  }
  await assertFails(getDocs(collection(alice,'giftStatus')));
});
test('nega documentos órfãos, IDs falsos, UID alheio, campos extras e tempo falso', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(db,'giftStatus','varal'),{ reserved:true,createdAt:serverTimestamp() }));
  await assertFails(setDoc(doc(db,'giftReservations','varal'),contact('alice')));
  await assertFails(reserve(db,'alice','inexistente'));
  await assertFails(reserve(db,'bob'));
  for (const extra of [{ role:'admin' },{ name:'' },{ name:'a'.repeat(101) },{ phone:'123' },{ createdAt:Timestamp.fromMillis(1) }]) await assertFails(reserve(db,'alice','varal',extra));
  for (const extra of [{ phone:'21999999999' },{ reserved:false },{ createdAt:Timestamp.fromMillis(1) }]) await assertFails(reserve(db,'alice','varal',{},extra));
});
test('reservas não podem ser alteradas, excluídas ou sobrescritas', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertSucceeds(reserve(db,'alice'));
  await assertFails(reserve(db,'alice'));
  for (const path of ['giftStatus','giftReservations']) {
    await assertFails(updateDoc(doc(db,path,'varal'),{ reserved:false }));
    await assertFails(deleteDoc(doc(db,path,'varal')));
  }
});
test('RSVP válido, privado, por UID e sem sobrescrita', async () => {
  const alice = env.authenticatedContext('alice').firestore();
  const bob = env.authenticatedContext('bob').firestore();
  await assertSucceeds(getDoc(doc(alice,'rsvps','alice')));
  await assertSucceeds(setDoc(doc(alice,'rsvps','alice'),rsvp('alice')));
  await assertSucceeds(getDoc(doc(alice,'rsvps','alice')));
  await assertFails(getDoc(doc(bob,'rsvps','alice')));
  await assertFails(getDocs(collection(alice,'rsvps')));
  await assertFails(setDoc(doc(alice,'rsvps','alice'),rsvp('alice')));
  await assertFails(deleteDoc(doc(alice,'rsvps','alice')));
});
test('RSVP rejeita fraudes e ausência com convidados', async () => {
  const db = env.authenticatedContext('alice').firestore();
  for (const extra of [{uid:'bob'},{role:'admin'},{guests:7},{guests:1.5},{attendance:'no',guests:2},{message:'a'.repeat(501)},{createdAt:Timestamp.fromMillis(1)}]) await assertFails(setDoc(doc(db,'rsvps','alice'),{...rsvp('alice'),...extra}));
  await assertFails(setDoc(doc(db,'rsvps','bob'),rsvp('alice')));
  await assertSucceeds(setDoc(doc(db,'rsvps','alice'),{...rsvp('alice'),attendance:'no',guests:0}));
});
