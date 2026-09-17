import { createHmac } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { validateRsvp } from '../server/validation.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Método não permitido.' }); }
  if (!req.headers['content-type']?.includes('application/json')) return res.status(415).json({ error: 'Formato inválido.' });
  if (Buffer.byteLength(JSON.stringify(req.body || {})) > 4096) return res.status(413).json({ error: 'Resposta muito longa.' });
  let data;
  try { data = validateRsvp(req.body); } catch (error) { return res.status(400).json({ error: error.message }); }
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, RSVP_HASH_SECRET } = process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY || !RSVP_HASH_SECRET) return res.status(503).json({ error: 'A confirmação estará disponível em breve. Volte aqui para enviar sua resposta.' });
  try {
    if (!getApps().length) initializeApp({ credential: cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }) });
    const db = getFirestore();
    const hash = value => createHmac('sha256', RSVP_HASH_SECRET).update(value).digest('hex');
    const ip = String(req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    const hour = Math.floor(Date.now() / 3600000);
    const limitRef = db.collection('rsvpRateLimits').doc(hash(`${ip}:${hour}`));
    const responseRef = db.collection('rsvps').doc(hash(data.phone));
    await db.runTransaction(async transaction => {
      const [limit, existing] = await Promise.all([transaction.get(limitRef), transaction.get(responseRef)]);
      if ((limit.data()?.count || 0) >= 10) throw new Error('RATE_LIMIT');
      if (existing.exists) throw new Error('DUPLICATE');
      transaction.set(limitRef, { count: (limit.data()?.count || 0) + 1, expiresAt: Timestamp.fromMillis((hour + 2) * 3600000) });
      transaction.create(responseRef, { ...data, createdAt: FieldValue.serverTimestamp() });
    });
    return res.status(201).json({ ok: true });
  } catch (error) {
    if (error.message === 'RATE_LIMIT') return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em uma hora.' });
    if (error.message === 'DUPLICATE') return res.status(409).json({ error: 'Já recebemos uma resposta com esse WhatsApp. Para alterá-la, fale com Matheus ou Isadora.' });
    console.error('RSVP storage failed', error.code || 'unknown');
    return res.status(500).json({ error: 'Não conseguimos salvar agora. Por favor, tente novamente.' });
  }
}
