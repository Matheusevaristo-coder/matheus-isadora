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
export function firebaseServices() {
  if (!Object.values(config).every(Boolean)) throw new Error('O site ainda está sendo conectado ao Firebase. Tente novamente em breve.');
  if (!services) {
    const app = initializeApp(config);
    services = { auth: getAuth(app), db: getFirestore(app) };
  }
  return services;
}
export async function firebaseSession() {
  const currentServices = firebaseServices();
  await currentServices.auth.authStateReady();
  if (!currentServices.auth.currentUser) {
    signingIn ||= signInAnonymously(currentServices.auth).finally(() => { signingIn = null; });
    await signingIn;
  }
  return { db: currentServices.db, uid: currentServices.auth.currentUser.uid };
}
