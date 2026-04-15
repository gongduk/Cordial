import { NextRequest, NextResponse } from "next/server";
import { analyzeEmotion } from "@/server/ai/analyzeEmotion";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (typeof text !== "string" || text.trim().length < 5) {
      return NextResponse.json({ error: "최소 5자 이상 입력해 주세요." }, { status: 400 });
    }

    const emotionVector = await analyzeEmotion(text);
    return NextResponse.json(emotionVector);
  } catch (error) {
    console.error("[analyze-emotion]", error);
    return NextResponse.json({ error: "감정 분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
