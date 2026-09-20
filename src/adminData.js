import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, limit, query, runTransaction, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { firebaseServices } from './firebase';

export async function currentAdminUser() {
  const { auth } = firebaseServices();
  await auth.authStateReady();
  return auth.currentUser;
}

export async function signInAdmin() {
  const { auth } = firebaseServices();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return (await signInWithPopup(auth, provider)).user;
}

export async function signOutAdmin() { return signOut(firebaseServices().auth); }

export async function loadAdminDashboard() {
  const { auth, db } = firebaseServices();
  await auth.authStateReady();
  if (!auth.currentUser?.email || auth.currentUser.isAnonymous) throw new Error('Entre com uma conta Google autorizada.');
  const [reservations, rsvps, admins, catalog] = await Promise.all([
    getDocs(query(collection(db, 'giftReservations'), limit(100))),
    getDocs(query(collection(db, 'rsvps'), limit(200))),
    getDocs(query(collection(db, 'admins'), limit(20))),
    getDocs(query(collection(db, 'giftCatalog'), limit(100))),
  ]);
  const map = snapshot => snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  return { reservations: map(reservations), rsvps: map(rsvps), admins: map(admins), catalog: map(catalog) };
}

function normalizeGift(gift) {
  const url = String(gift.url || '').trim();
  const data = {
    number: Number(gift.number),
    name: String(gift.name || '').trim(),
    category: String(gift.category || '').trim(),
    description: String(gift.description || '').trim(),
    url,
    store: String(gift.store || '').trim(),
    price: Number(gift.price) || 0,
    maxPrice: Number(gift.maxPrice) || 0,
    active: gift.active !== false,
    deleted: gift.deleted === true,
  };
  if (!Number.isInteger(data.number) || data.number < 1 || data.number > 999 || data.name.length < 2 || data.name.length > 120 || data.category.length < 2 || data.category.length > 50 || data.description.length > 300 || data.store.length < 2 || data.store.length > 50 || data.price < 0 || data.maxPrice < 0) throw new Error('Confira número, título, categoria, loja e valores.');
  try { if (new URL(url).protocol !== 'https:') throw new Error(); }
  catch { throw new Error('Informe um link HTTPS válido.'); }
  return data;
}

export async function saveGift(gift) {
  const { db } = firebaseServices();
  const data = normalizeGift(gift);
  const generated = data.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55);
  const id = gift.id || `${generated || 'presente'}-${Date.now().toString(36)}`;
  const reference = doc(db, 'giftCatalog', id);
  await runTransaction(db, async transaction => {
    const existing = await transaction.get(reference);
    transaction.set(reference, { ...data, createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(), updatedAt: serverTimestamp() });
  });
  return id;
}

export async function reserveGiftAsAdmin({ id, name, phone }) {
  const normalizedName = String(name || '').trim();
  const normalizedPhone = String(phone || '').replace(/\D/g, '');
  const { auth, db } = firebaseServices();
  if (normalizedName.length < 2 || normalizedName.length > 100 || !/^\d{10,13}$/.test(normalizedPhone)) throw new Error('Confira o nome e o WhatsApp com DDD.');
  const batch = writeBatch(db);
  batch.set(doc(db, 'giftStatus', id), { reserved: true, createdAt: serverTimestamp() });
  batch.set(doc(db, 'giftReservations', id), { uid: auth.currentUser.uid, name: normalizedName, phone: normalizedPhone, createdAt: serverTimestamp() });
  try { await batch.commit(); }
  catch { throw new Error('Este presente já está reservado ou indisponível.'); }
}

export async function addAdmin({ email, name }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedName = String(name || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254 || normalizedName.length < 2 || normalizedName.length > 80) throw new Error('Confira o nome e o e-mail Google.');
  const { auth, db } = firebaseServices();
  await setDoc(doc(db, 'admins', normalizedEmail), { email: normalizedEmail, name: normalizedName, createdBy: auth.currentUser.email, createdAt: serverTimestamp() });
}

export async function removeAdmin(email) { await deleteDoc(doc(firebaseServices().db, 'admins', email)); }

export async function releaseGift(id) {
  const { db } = firebaseServices();
  const batch = writeBatch(db);
  batch.delete(doc(db, 'giftStatus', id));
  batch.delete(doc(db, 'giftReservations', id));
  await batch.commit();
}
