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
const googleToken = email => ({ email, email_verified: true, firebase: { sign_in_provider: 'google.com' } });
const bootstrapEmail = 'matheusevaristo10@gmail.com';
const catalogGift = (extra = {}) => ({ number:30,name:'Presente novo',category:'À mesa',description:'Descrição',url:'https://example.com/presente',store:'Loja',price:99.9,maxPrice:0,active:true,deleted:false,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),...extra });
test('permite todos os presentes do catálogo e consulta usada pelo site', async () => {
  const db = env.authenticatedContext('alice').firestore();
  for (const gift of gifts) await assertSucceeds(reserve(db,'alice',gift.id));
  const snapshot = await assertSucceeds(getDocs(query(collection(db,'giftStatus'),limit(40))));
  assert.equal(snapshot.size,gifts.length);
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
  await assertFails(getDocs(query(collection(anon,'giftStatus'),limit(40))));
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
  for (const extra of [{uid:'bob'},{role:'admin'},{guests:5},{guests:1.5},{attendance:'no',guests:2},{message:'a'.repeat(501)},{createdAt:Timestamp.fromMillis(1)}]) await assertFails(setDoc(doc(db,'rsvps','alice'),{...rsvp('alice'),...extra}));
  await assertFails(setDoc(doc(db,'rsvps','bob'),rsvp('alice')));
  await assertSucceeds(setDoc(doc(db,'rsvps','alice'),{...rsvp('alice'),attendance:'no',guests:0}));
});
test('administrador Google autorizado lê os dados privados e libera um presente', async () => {
  const guest = env.authenticatedContext('guest').firestore();
  const admin = env.authenticatedContext('matheus', googleToken(bootstrapEmail)).firestore();
  await assertSucceeds(reserve(guest,'guest'));
  await assertSucceeds(setDoc(doc(guest,'rsvps','guest'),rsvp('guest')));
  assert.equal((await assertSucceeds(getDocs(query(collection(admin,'giftReservations'),limit(100))))).size,1);
  assert.equal((await assertSucceeds(getDocs(query(collection(admin,'rsvps'),limit(200))))).size,1);
  const batch = writeBatch(admin);
  batch.delete(doc(admin,'giftStatus','varal'));
  batch.delete(doc(admin,'giftReservations','varal'));
  await assertSucceeds(batch.commit());
  assert.equal((await assertSucceeds(getDoc(doc(admin,'giftStatus','varal')))).exists(),false);
  assert.equal((await assertSucceeds(getDoc(doc(admin,'giftReservations','varal')))).exists(),false);
});
test('administrador principal cadastra Isadora sem permitir autoelevação', async () => {
  const admin = env.authenticatedContext('matheus', googleToken(bootstrapEmail)).firestore();
  const isadoraEmail = 'isadora@example.com';
  const record = { email:isadoraEmail,name:'Isadora',createdBy:bootstrapEmail,createdAt:serverTimestamp() };
  await assertSucceeds(setDoc(doc(admin,'admins',isadoraEmail),record));
  const isadora = env.authenticatedContext('isadora',googleToken(isadoraEmail)).firestore();
  await assertSucceeds(getDocs(query(collection(isadora,'giftReservations'),limit(100))));
  await assertSucceeds(getDocs(query(collection(isadora,'admins'),limit(20))));
  const ordinary = env.authenticatedContext('mallory',googleToken('mallory@example.com')).firestore();
  await assertFails(setDoc(doc(ordinary,'admins','mallory@example.com'),{email:'mallory@example.com',name:'Mallory',createdBy:'mallory@example.com',createdAt:serverTimestamp()}));
  await assertFails(getDocs(query(collection(ordinary,'giftReservations'),limit(100))));
});
test('acesso administrativo exige Google verificado e schema estrito', async () => {
  const unverified = env.authenticatedContext('fake',{email:bootstrapEmail,email_verified:false,firebase:{sign_in_provider:'google.com'}}).firestore();
  const password = env.authenticatedContext('fake2',{email:bootstrapEmail,email_verified:true,firebase:{sign_in_provider:'password'}}).firestore();
  for (const db of [unverified,password]) await assertFails(getDocs(query(collection(db,'rsvps'),limit(200))));
  const admin = env.authenticatedContext('matheus',googleToken(bootstrapEmail)).firestore();
  await assertFails(setDoc(doc(admin,'admins','bad@example.com'),{email:'bad@example.com',name:'B',createdBy:bootstrapEmail,createdAt:serverTimestamp(),role:'owner'}));
  await assertFails(getDocs(collection(admin,'rsvps')));
  await assertFails(getDocs(query(collection(admin,'rsvps'),limit(201))));
  await assertSucceeds(setDoc(doc(admin,'admins',bootstrapEmail),{email:bootstrapEmail,name:'Matheus',createdBy:bootstrapEmail,createdAt:serverTimestamp()}));
  await assertFails(deleteDoc(doc(admin,'admins',bootstrapEmail)));
  await assertFails(updateDoc(doc(admin,'admins',bootstrapEmail),{name:'Outro'}));
});
test('CRUD do catálogo exige admin e controla disponibilidade para reserva', async () => {
  const admin = env.authenticatedContext('matheus',googleToken(bootstrapEmail)).firestore();
  const guest = env.authenticatedContext('guest').firestore();
  const ordinary = env.authenticatedContext('mallory',googleToken('mallory@example.com')).firestore();
  const reference = doc(admin,'giftCatalog','presente-novo');
  await assertFails(setDoc(doc(ordinary,'giftCatalog','invasor'),catalogGift()));
  await assertSucceeds(setDoc(reference,catalogGift()));
  assert.equal((await assertSucceeds(getDocs(query(collection(guest,'giftCatalog'),limit(100))))).size,1);
  await assertFails(getDocs(collection(guest,'giftCatalog')));
  await assertFails(updateDoc(doc(guest,'giftCatalog','presente-novo'),{name:'Alterado',updatedAt:serverTimestamp()}));
  await assertSucceeds(reserve(guest,'guest','presente-novo'));
  const release = writeBatch(admin);
  release.delete(doc(admin,'giftStatus','presente-novo'));
  release.delete(doc(admin,'giftReservations','presente-novo'));
  await assertSucceeds(release.commit());
  await assertSucceeds(updateDoc(reference,{active:false,updatedAt:serverTimestamp()}));
  await assertFails(reserve(guest,'guest','presente-novo'));
  await assertFails(updateDoc(reference,{url:'javascript:alert(1)',updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(reference,{name:'Título atualizado',url:'https://example.com/novo',active:true,updatedAt:serverTimestamp()}));
  await assertSucceeds(deleteDoc(reference));
});
