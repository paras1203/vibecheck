import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { isServerAdminEmail } from "@/lib/admin";
import { fetchAuditLogsSince } from "@/lib/audit-log-server";
import { getLlmStackPublicConfig } from "@/lib/llm-models";

export const dynamic = "force-dynamic";

const RANGE_KEYS = new Set([
  "today",
  "7d",
  "30d",
  "90d",
  "120d",
  "365d",
]);

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

function utcDayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
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

    const rawRange = request.nextUrl.searchParams.get("range") || "30d";
    const range = RANGE_KEYS.has(rawRange) ? rawRange : "30d";
    const startMs = startMsForRange(range);
    const logs = await fetchAuditLogsSince(startMs);

    const n = logs.length;
    const uniqueUsers = new Set(logs.map((l) => l.userId).filter(Boolean)).size;
    const sumPrompt = logs.reduce((a, l) => a + l.promptTokens, 0);
    const sumCand = logs.reduce((a, l) => a + l.candidatesTokens, 0);
    const sumCost = logs.reduce((a, l) => a + l.estimatedCostUsd, 0);
    const sumScore = logs.reduce((a, l) => a + l.overallScore, 0);

    const byDay = new Map<string, number>();
    for (const l of logs) {
      const k = utcDayKey(l.createdAtMs);
      byDay.set(k, (byDay.get(k) ?? 0) + 1);
    }
    const auditsByDay = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const deviceMobile = logs.filter((l) => l.device === "mobile").length;
    const deviceDesktop = n - deviceMobile;

    const industryHist: Record<string, number> = {};
    for (const l of logs) {
      const k = l.industryGuess?.trim() || "—";
      industryHist[k] = (industryHist[k] ?? 0) + 1;
    }
    const topIndustries = Object.entries(industryHist)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, count]) => ({ label, count }));

    const db = getAdminDb();
    let totalUserProfiles = 0;
    try {
      const cnt = await db.collection("users").count().get();
      totalUserProfiles = cnt.data().count;
    } catch {
      totalUserProfiles = 0;
    }

    const planCounts = { free: 0, pro: 0, agency: 0, other: 0 };
    try {
      const us = await db.collection("users").limit(1200).get();
      for (const d of us.docs) {
        const p = String(d.data()?.plan ?? "free").toLowerCase();
        if (p === "pro") planCounts.pro += 1;
        else if (p === "agency") planCounts.agency += 1;
        else if (p === "free") planCounts.free += 1;
        else planCounts.other += 1;
      }
    } catch {
      /* ignore */
    }

    let paymentsInRange = 0;
    try {
      const payAgg = await db
        .collection("payments")
        .where("createdAt", ">=", Timestamp.fromMillis(startMs))
        .count()
        .get();
      paymentsInRange = payAgg.data().count;
    } catch {
      paymentsInRange = 0;
    }

    return NextResponse.json({
      range,
      rangeStartMs: startMs,
      generatedAt: Date.now(),
      audits: {
        count: n,
        uniqueUsersWithAudit: uniqueUsers,
        avgPromptTokensPerAudit: n ? Math.round(sumPrompt / n) : 0,
        avgCandidatesTokensPerAudit: n ? Math.round(sumCand / n) : 0,
        avgTotalTokensPerAudit: n ? Math.round((sumPrompt + sumCand) / n) : 0,
        avgEstimatedCostUsdPerAudit: n ? sumCost / n : 0,
        sumEstimatedCostUsd: sumCost,
        avgOverallScore: n ? Math.round((sumScore / n) * 10) / 10 : 0,
        deviceSplit: { mobile: deviceMobile, desktop: deviceDesktop },
        auditsByDay,
        topIndustries,
      },
      users: {
        totalProfilesCounted: totalUserProfiles,
        planSampleSize: Math.min(1200, totalUserProfiles || 1200),
        planCountsSample: planCounts,
      },
      payments: {
        paidOrdersInRange: paymentsInRange,
      },
      llm: getLlmStackPublicConfig(),
      pricingNote:
        "Cost uses in-app flash vs non-flash $/1M-token heuristic; not official billing.",
    });
  } catch (e) {
    console.error("[admin/analytics]", e);
    return NextResponse.json(
      { error: "Analytics failed", details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
