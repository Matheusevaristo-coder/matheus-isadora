import { collection, doc, getDocFromServer, limit, onSnapshot, query, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { firebaseSession } from './firebase';
import { visibleGiftCatalog } from './catalog';
import { validateRsvp } from '../server/validation';
export function watchReservations(onChange, onError) {
  let stopped = false;
  let unsubscribe;
  firebaseSession().then(({ db }) => {
    if (stopped) return;
    unsubscribe = onSnapshot(query(collection(db, 'giftStatus'), limit(40)), { includeMetadataChanges: true }, snapshot => {
      if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) {
        onError(new Error('Aguardando conexão para confirmar a disponibilidade.'));
        return;
      }
      onChange(snapshot.docs.map(item => item.id));
    }, onError);
  }).catch(error => { if (!stopped) onError(error); });
  return () => { stopped = true; unsubscribe?.(); };
}
export function watchGiftCatalog(onChange, onError) {
  let stopped = false;
  let unsubscribe;
  firebaseSession().then(({ db }) => {
    if (stopped) return;
    unsubscribe = onSnapshot(query(collection(db, 'giftCatalog'), limit(100)), snapshot => {
      onChange(visibleGiftCatalog(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))));
    }, onError);
  }).catch(error => { if (!stopped) onError(error); });
  return () => { stopped = true; unsubscribe?.(); };
}
export async function reserveGift(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
  if (!/^[a-z0-9-]{2,80}$/.test(body.id) || name.length < 2 || name.length > 100 || !/^\d{10,13}$/.test(phone) || body.website) throw new Error('Confira seu nome e WhatsApp com DDD.');
  const { db, uid } = await firebaseSession();
  const status = doc(db, 'giftStatus', body.id);
  if ((await getDocFromServer(status)).exists()) throw new Error('Este presente já foi reservado. Escolha outro com carinho!');
  const batch = writeBatch(db);
  batch.set(status, { reserved: true, createdAt: serverTimestamp() });
  batch.set(doc(db, 'giftReservations', body.id), { uid, name, phone, createdAt: serverTimestamp() });
  try { await batch.commit(); }
  catch (error) {
    if (error.code === 'permission-denied' && (await getDocFromServer(status)).exists()) throw new Error('Este presente acabou de ser reservado. Escolha outro com carinho!');
    throw new Error('Não conseguimos salvar a reserva. Confira a conexão e tente novamente.');
  }
}
export async function submitRsvp(body) {
  const data = validateRsvp(body);
  const { db, uid } = await firebaseSession();
  const reference = doc(db, 'rsvps', uid);
  if ((await getDocFromServer(reference)).exists()) throw new Error('Já recebemos sua resposta neste navegador. Para alterá-la, fale com Isadora ou Matheus.');
  try { await setDoc(reference, { ...data, uid, createdAt: serverTimestamp() }); }
  catch { throw new Error('Não conseguimos salvar a resposta. Se já confirmou, fale com o casal; caso contrário, tente novamente.'); }
}
