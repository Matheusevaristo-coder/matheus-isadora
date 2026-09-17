import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { gifts } from '../src/content.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Método não permitido.' }); }
  let data;
  if (req.method === 'POST') {
    if (!req.headers['content-type']?.includes('application/json')) return res.status(415).json({ error: 'Formato inválido.' });
    const body = req.body || {};
    if (Buffer.byteLength(JSON.stringify(body)) > 2048) return res.status(413).json({ error: 'Resposta muito longa.' });
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
    if (!gifts.some(gift => gift.id === body.id) || name.length < 2 || name.length > 100 || !/^\d{10,13}$/.test(phone) || body.website) return res.status(400).json({ error: 'Confira o presente, seu nome e WhatsApp com DDD.' });
    data = { id: body.id, name, phone };
  }
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) return res.status(503).json({ error: 'As reservas ainda não estão disponíveis. Fale com Matheus ou Isadora antes de comprar.' });
  try {
    if (!getApps().length) initializeApp({ credential: cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }) });
    const collection = getFirestore().collection('giftReservations');
    if (req.method === 'GET') {
      const snapshot = await collection.select().get();
      return res.status(200).json({ reserved: snapshot.docs.map(doc => doc.id) });
    }
    // Atomic create: only one guest can reserve each gift, even simultaneously.
    await collection.doc(data.id).create({ name: data.name, phone: data.phone, createdAt: FieldValue.serverTimestamp() });
    return res.status(201).json({ ok: true });
  } catch (error) {
    if (error.code === 6 || error.code === 'already-exists') return res.status(409).json({ error: 'Este presente acabou de ser reservado. Escolha outro com carinho!' });
    return res.status(500).json({ error: 'Não conseguimos consultar ou salvar a reserva. Tente novamente.' });
  }
}
