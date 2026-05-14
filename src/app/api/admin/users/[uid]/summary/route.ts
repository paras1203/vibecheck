import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdminBearer } from "@/lib/request-admin-auth";
import { coerceUserCreditsFromDocument } from "@/lib/credits-config";

export const dynamic = "force-dynamic";

const RANGE_KEYS = new Set(["today", "7d", "30d", "90d", "120d", "365d"]);

function startMsForRange(key: string, now = Date.now()): number {
  if (key === "today") {
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime();
  }
  const days =
    key === "7d"
      ? 7
      : key === "30d"
        ? 30
        : key === "90d"
          ? 90
          : key === "120d"
            ? 120
            : key === "365d"
              ? 365
              : 30;
  return now - days * 86_400_000;
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ uid: string }> },
) {
  try {
    await requireAdminBearer(request);
  } catch (e) {
    const status = e instanceof Error && e.message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: status === 403 ? "Forbidden" : "Unauthorized" }, { status });
  }

  const { uid } = await ctx.params;
  if (!uid?.trim()) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  const rawRange = request.nextUrl.searchParams.get("range") || "30d";
  const range = RANGE_KEYS.has(rawRange) ? rawRange : "30d";
  const startMs = startMsForRange(range);

  try {
    const db = getAdminDb();
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const ud = userSnap.data()!;
    const credits = coerceUserCreditsFromDocument(ud.credits);
    const plan = String(ud.plan ?? "free").toLowerCase();
    const email = String(ud.email ?? "");

    let roastCount = 0;
    let sumPrompt = 0;
    let sumCand = 0;
    let sumCost = 0;

    try {
      const snap = await db
        .collection("audit_logs")
        .where("userId", "==", uid)
        .where("createdAt", ">=", Timestamp.fromMillis(startMs))
        .get();
      roastCount = snap.size;
      for (const d of snap.docs) {
        const row = d.data();
        sumPrompt += Number(row.promptTokens) || 0;
        sumCand += Number(row.candidatesTokens) || 0;
        sumCost += Number(row.estimatedCostUsd) || 0;
      }
    } catch {
      try {
        const snap = await db.collection("audit_logs").where("userId", "==", uid).limit(800).get();
        const rows = snap.docs
          .map((d) => {
            const row = d.data();
            const ts = (row.createdAt as Timestamp | undefined)?.toMillis?.() ?? 0;
            return { row, ts };
          })
          .filter((x) => x.ts >= startMs);
        roastCount = rows.length;
        for (const { row } of rows) {
          sumPrompt += Number(row.promptTokens) || 0;
          sumCand += Number(row.candidatesTokens) || 0;
          sumCost += Number(row.estimatedCostUsd) || 0;
        }
      } catch {
        roastCount = 0;
      }
    }

    const n = roastCount;
    return NextResponse.json({
      range,
      uid,
      email,
      credits,
      plan,
      roastsInRange: roastCount,
      avgPromptTokensPerRoast: n ? Math.round(sumPrompt / n) : 0,
      avgCandidatesTokensPerRoast: n ? Math.round(sumCand / n) : 0,
      avgTotalTokensPerRoast: n ? Math.round((sumPrompt + sumCand) / n) : 0,
      sumEstimatedCostUsd: sumCost,
    });
  } catch (err) {
    console.error("[admin/users/summary]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Summary failed" },
      { status: 500 },
    );
  }
}
