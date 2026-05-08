import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const projectIdBuild = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const authDomainBuild =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ||
  (projectIdBuild ? `${projectIdBuild}.firebaseapp.com` : undefined);

const measurementIdBuild = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim();

const buildTimeConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: authDomainBuild,
  projectId: projectIdBuild,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  ...(measurementIdBuild ? { measurementId: measurementIdBuild } : {}),
};

let runtimeOverride: FirebaseOptions | null = null;

function normalizeOptions(raw: FirebaseOptions): FirebaseOptions | null {
  const apiKey = typeof raw.apiKey === "string" ? raw.apiKey.trim() : "";
  const projectId = typeof raw.projectId === "string" ? raw.projectId.trim() : "";
  const storageBucket =
    typeof raw.storageBucket === "string" ? raw.storageBucket.trim() : "";
  const messagingSenderId =
    typeof raw.messagingSenderId === "string" ? raw.messagingSenderId.trim() : "";
  const appId = typeof raw.appId === "string" ? raw.appId.trim() : "";
  if (!apiKey || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null;
  }
  const measurementId =
    typeof raw.measurementId === "string" ? raw.measurementId.trim() : undefined;
  let authDomain =
    typeof raw.authDomain === "string" ? raw.authDomain.trim() : "";
  if (!authDomain) {
    authDomain = `${projectId}.firebaseapp.com`;
  }
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId ? { measurementId } : {}),
  };
}

function activeFirebaseOptions(): FirebaseOptions | null {
  return normalizeOptions(runtimeOverride ?? buildTimeConfig);
}

export function isFirebaseClientConfigured(): boolean {
  return activeFirebaseOptions() !== null;
}

let inflightHydrate: Promise<boolean> | null = null;

async function performHydrate(): Promise<boolean> {
  try {
    const res = await fetch("/api/firebase/client-config", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as Record<string, unknown>;
    if (data.error === "not_configured") return false;

    const apiKey = typeof data.apiKey === "string" ? data.apiKey.trim() : "";
    const projectId = typeof data.projectId === "string" ? data.projectId.trim() : "";
    const storageBucket =
      typeof data.storageBucket === "string" ? data.storageBucket.trim() : "";
    const messagingSenderId =
      typeof data.messagingSenderId === "string" ? data.messagingSenderId.trim() : "";
    const appId = typeof data.appId === "string" ? data.appId.trim() : "";
    if (!apiKey || !projectId || !storageBucket || !messagingSenderId || !appId) {
      return false;
    }
    const authDomain =
      typeof data.authDomain === "string" ? data.authDomain.trim() : `${projectId}.firebaseapp.com`;
    const measurementId =
      typeof data.measurementId === "string" ? data.measurementId.trim() : undefined;

    runtimeOverride = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
      ...(measurementId ? { measurementId } : {}),
    };
    bundle = null;
    return true;
  } catch {
    return false;
  }
}

/** When `NEXT_PUBLIC_*` was empty at build (Docker/Railway) but vars exist on the server. */
export async function hydrateFirebaseClientFromApi(): Promise<boolean> {
  if (isFirebaseClientConfigured()) return true;
  if (!inflightHydrate) {
    inflightHydrate = performHydrate().finally(() => {
      inflightHydrate = null;
    });
  }
  return inflightHydrate;
}

type FirebaseBundle = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

let bundle: FirebaseBundle | null = null;

function getFirebaseBundle(): FirebaseBundle {
  const firebaseConfig = activeFirebaseOptions();
  if (!firebaseConfig) {
    throw new Error(
      "Firebase client is not configured. Set NEXT_PUBLIC_FIREBASE_* (local/build) or ensure Railway defines the same keys so /api/firebase/client-config can serve them.",
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
