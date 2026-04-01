import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    void id;
    
    return NextResponse.json(
      { error: "Roast not found. Please generate a new roast." },
      { status: 404 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch roast" },
      { status: 500 }
    );
  }
}

