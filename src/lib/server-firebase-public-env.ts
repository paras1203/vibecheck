import "server-only";

export type FirebaseWebPublicConfig = {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

const SUFFIX_TO_FIELD: Record<string, keyof FirebaseWebPublicConfig> = {
  API_KEY: "apiKey",
  AUTH_DOMAIN: "authDomain",
  PROJECT_ID: "projectId",
  STORAGE_BUCKET: "storageBucket",
  MESSAGING_SENDER_ID: "messagingSenderId",
  APP_ID: "appId",
  MEASUREMENT_ID: "measurementId",
};

const NP_PREFIX = "NEXT_PUBLIC_FIREBASE_";
const WEB_PREFIX = "FIREBASE_WEB_";

function tryParseFirebaseWebConfigJson(): FirebaseWebPublicConfig | null {
  const raw = process.env.FIREBASE_WEB_CONFIG?.trim();
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const apiKey = typeof o.apiKey === "string" ? o.apiKey.trim() : "";
    const projectId = typeof o.projectId === "string" ? o.projectId.trim() : "";
    const storageBucket =
      typeof o.storageBucket === "string" ? o.storageBucket.trim() : "";
    const messagingSenderId =
      typeof o.messagingSenderId === "string" ? o.messagingSenderId.trim() : "";
    const appId = typeof o.appId === "string" ? o.appId.trim() : "";
    if (!apiKey || !projectId || !storageBucket || !messagingSenderId || !appId) {
      return null;
    }
    const authDomain =
      typeof o.authDomain === "string" ? o.authDomain.trim() : undefined;
    const measurementId =
      typeof o.measurementId === "string" ? o.measurementId.trim() : undefined;
    return {
      apiKey,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
      ...(authDomain ? { authDomain } : {}),
      ...(measurementId ? { measurementId } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Reads Firebase **web** public config from the running Node process.
 * Uses dynamic env iteration so values are **not** compile-time inlined (Docker/Railway:
 * NEXT_PUBLIC_* is often empty in the client bundle but present at runtime on the server).
 */
export function readFirebaseWebPublicConfigFromProcessEnv(): FirebaseWebPublicConfig | null {
  const fromJson = tryParseFirebaseWebConfigJson();
  if (fromJson) return fromJson;

  const gathered: Partial<Record<keyof FirebaseWebPublicConfig, string>> = {};

  for (const [key, raw] of Object.entries(process.env)) {
    const value = raw?.trim();
    if (!value) continue;

    if (key.startsWith(WEB_PREFIX)) {
      const suf = key.slice(WEB_PREFIX.length);
      const field = SUFFIX_TO_FIELD[suf];
      if (field) gathered[field] = value;
      continue;
    }

    if (key.startsWith(NP_PREFIX)) {
      const suf = key.slice(NP_PREFIX.length);
      const field = SUFFIX_TO_FIELD[suf];
      if (field && gathered[field] == null) gathered[field] = value;
    }
  }

  const {
    apiKey,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    authDomain,
    measurementId,
  } = gathered;

  if (!apiKey || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null;
  }

  return {
    apiKey,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(authDomain ? { authDomain } : {}),
    ...(measurementId ? { measurementId } : {}),
  };
}
