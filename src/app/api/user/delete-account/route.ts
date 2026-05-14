import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deletionConfirmationMatches } from "@/lib/account-deletion-constants";
import { deleteAuthUserIfExists, eraseFirestorePersonalDataForUid } from "@/lib/account-erasure-server";
import { requireFirebaseApiUser } from "@/lib/require-firebase-api-auth";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  confirmation: z.string(),
});

export async function POST(request: NextRequest) {
  const auth = await requireFirebaseApiUser(request);
  if (!auth.ok) return auth.response;
  const { uid } = auth;

  try {
    const json = await request.json();
    const { confirmation } = bodySchema.parse(json);
    if (!deletionConfirmationMatches(confirmation)) {
      return NextResponse.json(
        {
          error:
            "Confirmation does not match. Type DELETE MY ACCOUNT (any letter casing) to confirm.",
        },
        { status: 400 },
      );
    }

    await eraseFirestorePersonalDataForUid(uid);
    await deleteAuthUserIfExists(uid);

    return NextResponse.json({ ok: true as const });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.flatten() }, { status: 400 });
    }
    console.error("[delete-account]", error);
    return NextResponse.json(
      { error: "Account deletion could not be completed. Try again or contact support." },
      { status: 500 },
    );
  }
}
