import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const userRef = getAdminDb().collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await userRef.delete();

    let deletedScans = 0;
    let deletedRoasts = 0;

    try {
      const scansQuery = getAdminDb().collection("scans").where("userId", "==", userId);
      const scansSnapshot = await scansQuery.get();
      deletedScans = scansSnapshot.size;
      const deleteScansPromises = scansSnapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(deleteScansPromises);
    } catch (error) {
      console.warn("No scans collection or error deleting scans:", error);
    }

    try {
      const roastsQuery = getAdminDb().collection("roasts").where("userId", "==", userId);
      const roastsSnapshot = await roastsQuery.get();
      deletedRoasts = roastsSnapshot.size;
      const deleteRoastsPromises = roastsSnapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(deleteRoastsPromises);
    } catch (error) {
      console.warn("No roasts collection or error deleting roasts:", error);
    }

    return NextResponse.json(
      { 
        success: true,
        message: "User data and scans history deleted successfully",
        deletedScans,
        deletedRoasts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset user error:", error);
    return NextResponse.json(
      {
        error: "Failed to reset user data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
