import { NextRequest, NextResponse } from "next/server";
import { searchAll } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = searchAll(q, 20);
  return NextResponse.json({ query: q, results });
}
