import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params;
    
    return NextResponse.json(
      { error: "HTML report generation not yet implemented. Please check back soon." },
      { status: 501 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to generate HTML report" },
      { status: 500 }
    );
  }
}

