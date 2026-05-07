import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { isServerAdminEmail } from "@/lib/admin";
import { newUserCreditsDefault } from "@/lib/credits-config";

/**
 * One-time / occasional: create `users/{uid}` in Firestore for each Firebase Auth user
 * that does not yet have a profile doc (e.g. after Firestore was just enabled).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const match = /^Bearer\s+(.+)$/i.exec(authHeader);
    if (!match?.[1]) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await getAdminAuth().verifyIdToken(match[1]);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!isServerAdminEmail(decoded.email ?? null)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as { dryRun?: boolean };
    const dryRun = Boolean(body.dryRun);

    const db = getAdminDb();
    let scanned = 0;
    let created = 0;
    let skippedExisting = 0;
    let pageToken: string | undefined;

    do {
      const list = await getAdminAuth().listUsers(1000, pageToken);
      for (const record of list.users) {
        scanned++;
        const ref = db.collection("users").doc(record.uid);
        const snap = await ref.get();
        if (snap.exists) {
          skippedExisting++;
          continue;
        }
        if (dryRun) {
          created++;
          continue;
        }
        await ref.set(
          {
            uid: record.uid,
            email: record.email ?? "",
            credits: newUserCreditsDefault(),
            plan: "free",
            ...(record.displayName ? { displayName: record.displayName } : {}),
            ...(record.photoURL ? { photoURL: record.photoURL } : {}),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        created++;
      }
      pageToken = list.pageToken;
    } while (pageToken);

    return NextResponse.json({
      ok: true,
      dryRun,
      scanned,
      created,
      skippedExisting,
      note: dryRun
        ? "No writes performed. Omit dryRun or set dryRun:false to create missing profiles."
        : "Missing user documents were created with default credits and plan free.",
    });
  } catch (e) {
    console.error("backfill-user-profiles:", e);
    return NextResponse.json(
      { error: "Backfill failed", details: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
