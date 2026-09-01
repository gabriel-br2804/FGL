import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/ia/answer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const question = typeof body?.question === "string" ? body.question.slice(0, 500) : "";
  if (!question.trim()) {
    return NextResponse.json({ error: "Pergunta vazia." }, { status: 400 });
  }
  const result = answerQuestion(question);
  return NextResponse.json(result);
}
