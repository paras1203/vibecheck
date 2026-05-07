import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const authDomain =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ||
  (projectId ? `${projectId}.firebaseapp.com` : undefined);

const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain,
  projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  ...(measurementId ? { measurementId } : {}),
};

export function isFirebaseClientConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.storageBucket,
  );
}

type FirebaseBundle = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

let bundle: FirebaseBundle | null = null;

function getFirebaseBundle(): FirebaseBundle {
  if (!isFirebaseClientConfigured()) {
    throw new Error(
      "Firebase client is not configured. Set NEXT_PUBLIC_FIREBASE_* vars (api key, project id, app id, messaging sender id, storage bucket).",
    );
  }
  if (bundle) {
    return bundle;
  }

  const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
  const auth = getAuth(app);
  void setPersistence(auth, browserLocalPersistence).catch((e) => {
    console.warn("Firebase auth persistence:", e);
  });
  const db = getFirestore(app);
  bundle = { app, auth, db };
  return bundle;
}

export function getFirebaseApp(): FirebaseApp {
  return getFirebaseBundle().app;
}

export function getFirebaseAuth(): Auth {
  return getFirebaseBundle().auth;
}

export function getFirestoreClient(): Firestore {
  return getFirebaseBundle().db;
}

export default getFirebaseApp;
