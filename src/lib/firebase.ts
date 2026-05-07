import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const authDomain =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ||
  (projectId ? `${projectId}.firebaseapp.com` : undefined);

const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim();

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain,
  projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  ...(measurementId ? { measurementId } : {}),
};

// Initialize Firebase app only if it hasn't been initialized already
// This prevents "App already initialized" errors in Next.js hot-reloading
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Export Firebase services
export const auth: Auth = getAuth(app);
void setPersistence(auth, browserLocalPersistence).catch((e) => {
  console.warn("Firebase auth persistence:", e);
});
export const db: Firestore = getFirestore(app);
export default app;

