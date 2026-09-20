import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, limit, query, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
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
  const [reservations, rsvps, admins] = await Promise.all([
    getDocs(query(collection(db, 'giftReservations'), limit(100))),
    getDocs(query(collection(db, 'rsvps'), limit(200))),
    getDocs(query(collection(db, 'admins'), limit(20))),
  ]);
  const map = snapshot => snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  return { reservations: map(reservations), rsvps: map(rsvps), admins: map(admins) };
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
