import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
let services;
let signingIn;
export async function firebaseSession() {
  if (!Object.values(config).every(Boolean)) throw new Error('O site ainda está sendo conectado ao Firebase. Tente novamente em breve.');
  if (!services) {
    const app = initializeApp(config);
    services = { auth: getAuth(app), db: getFirestore(app) };
  }
  await services.auth.authStateReady();
  if (!services.auth.currentUser) {
    signingIn ||= signInAnonymously(services.auth).finally(() => { signingIn = null; });
    await signingIn;
  }
  return { db: services.db, uid: services.auth.currentUser.uid };
}
