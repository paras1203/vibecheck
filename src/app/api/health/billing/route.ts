import { NextResponse } from "next/server";
import { readFirebaseWebPublicConfigFromProcessEnv } from "@/lib/server-firebase-public-env";
import { resolveDodoEnvironment } from "@/lib/dodo-server";

export const dynamic = "force-dynamic";

/**
 * Deployment checklist for Dodo + Firebase (no secrets exposed).
 * Returns 503 if any required billing prerequisite is missing.
 */
export async function GET() {
  const web = readFirebaseWebPublicConfigFromProcessEnv();
  const firebaseAdminEmail = Boolean(process.env.FIREBASE_CLIENT_EMAIL?.trim());
  const firebaseAdminKey = Boolean(process.env.FIREBASE_PRIVATE_KEY?.trim());
  const dodoKey = Boolean(process.env.DODO_PAYMENTS_API_KEY?.trim());
  const pro = Boolean(process.env.DODO_PRODUCT_PRO_ID?.trim());
  const agency = Boolean(process.env.DODO_PRODUCT_AGENCY_PACK_ID?.trim());
  const free = Boolean(process.env.DODO_PRODUCT_FREE_TEST_ID?.trim());

  const checks = {
    firebaseWebConfig: web != null,
    firebaseProjectId: web?.projectId ?? null,
    firebaseAdminServiceAccount: firebaseAdminEmail && firebaseAdminKey,
    dodoApiKey: dodoKey,
    dodoProductPro: pro,
    dodoProductAgency: agency,
    dodoProductFreeTest: free,
    dodoEnvironment: resolveDodoEnvironment(),
  };

  const ok =
    checks.firebaseWebConfig &&
    checks.firebaseAdminServiceAccount &&
    checks.dodoApiKey &&
    checks.dodoProductPro &&
    checks.dodoProductAgency &&
    checks.dodoProductFreeTest;

  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
