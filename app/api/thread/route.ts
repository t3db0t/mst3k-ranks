import { NextResponse } from "next/server";
import { getThreadAnalysis } from "@/lib/thread";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const analysis = await getThreadAnalysis();
    return NextResponse.json(analysis);
  } catch (err) {
    console.error("Thread API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch thread" },
      { status: 500 }
    );
  }
}
