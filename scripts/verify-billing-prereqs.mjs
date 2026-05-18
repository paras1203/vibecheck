/**
 * Local prerequisite check for Dodo + Firebase billing (read-only).
 * Loads .env.local then .env if present. Does not call Firebase or Dodo APIs.
 */

import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: resolve(root, ".env.local") });
dotenv.config({ path: resolve(root, ".env") });

function has(k) {
  const v = process.env[k];
  return typeof v === "string" && v.trim().length > 0;
}

const rows = [];

function row(ok, label, hint = "") {
  rows.push({ ok, label, hint });
}

let firebaseWebConfigJsonOk = false;
if (has("FIREBASE_WEB_CONFIG")) {
  try {
    const o = JSON.parse(process.env.FIREBASE_WEB_CONFIG);
    firebaseWebConfigJsonOk =
      typeof o?.projectId === "string" &&
      o.projectId.trim().length > 0 &&
      typeof o?.apiKey === "string" &&
      o.apiKey.trim().length > 0;
  } catch {
    firebaseWebConfigJsonOk = false;
  }
}

const webProject =
  has("NEXT_PUBLIC_FIREBASE_PROJECT_ID") ||
  has("FIREBASE_WEB_PROJECT_ID") ||
  firebaseWebConfigJsonOk;

const webApiKey =
  has("NEXT_PUBLIC_FIREBASE_API_KEY") || has("FIREBASE_WEB_API_KEY") || firebaseWebConfigJsonOk;

row(webProject, "Firebase web project id", "NEXT_PUBLIC_FIREBASE_PROJECT_ID or FIREBASE_WEB_*");
row(webApiKey, "Firebase web API key", "NEXT_PUBLIC_FIREBASE_API_KEY or FIREBASE_WEB_CONFIG JSON");
row(
  has("FIREBASE_CLIENT_EMAIL"),
  "FIREBASE_CLIENT_EMAIL (Admin SDK)",
  "Service account email from Firebase Console → Project settings → Service accounts"
);
row(
  has("FIREBASE_PRIVATE_KEY"),
  "FIREBASE_PRIVATE_KEY (Admin SDK)",
  "Private key with \\n newlines; must be the same Firebase project as web config"
);
row(has("DODO_PAYMENTS_API_KEY"), "DODO_PAYMENTS_API_KEY", "Dodo dashboard API key (server only)");
row(has("DODO_PRODUCT_PRO_ID"), "DODO_PRODUCT_PRO_ID", "Dodo product id for Pro credit");
row(has("DODO_PRODUCT_AGENCY_PACK_ID"), "DODO_PRODUCT_AGENCY_PACK_ID", "Dodo product id for Agency pack");
row(has("DODO_PRODUCT_FREE_TEST_ID"), "DODO_PRODUCT_FREE_TEST_ID", "Dodo sandbox product id");

const bad = rows.filter((r) => !r.ok);

console.log("Billing / Firebase prerequisite check\n");
for (const r of rows) {
  const mark = r.ok ? "✓" : "✗";
  console.log(`${mark} ${r.label}${r.hint ? ` — ${r.hint}` : ""}`);
}

if (bad.length) {
  console.log(`\n${bad.length} missing — fix .env.local then run: npm run verify-billing`);
  console.log("After deploy, GET /api/health/billing should return { ok: true }.");
  process.exit(1);
}

console.log("\nAll required variables present.");
console.log("After deploy, GET /api/health/billing should return { ok: true }.");
process.exit(0);
