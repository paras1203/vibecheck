import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdminBearer } from "@/lib/request-admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminBearer(request);
  } catch (e) {
    const status = e instanceof Error && e.message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: status === 403 ? "Forbidden" : "Unauthorized" }, { status });
  }

  const q = (request.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  const limRaw = Number(request.nextUrl.searchParams.get("limit")) || 25;
  const limit = Math.min(50, Math.max(1, limRaw));

  try {
    const db = getAdminDb();
    if (!q) {
      const snap = await db.collection("users").limit(limit).get();
      const users = snap.docs.map((d) => ({
        uid: d.id,
        email: String(d.data()?.email ?? ""),
        plan: String(d.data()?.plan ?? "free"),
      }));
      return NextResponse.json({ users });
    }

    const snap = await db
      .collection("users")
      .orderBy("email")
      .startAt(q)
      .endAt(`${q}\uf8ff`)
      .limit(limit)
      .get();

    const users = snap.docs.map((d) => ({
      uid: d.id,
      email: String(d.data()?.email ?? ""),
      plan: String(d.data()?.plan ?? "free"),
    }));

    return NextResponse.json({ users });
  } catch (err) {
    console.error("[admin/users/search]", err);
    return NextResponse.json(
      { error: "Search failed", users: [] },
      { status: 500 },
    );
  }
}
