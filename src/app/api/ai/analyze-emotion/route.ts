import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { analyzeEmotion } from "@/server/ai/analyzeEmotion";
import { prisma } from "@/shared/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json() as { text: string };

    if (typeof text !== "string" || text.trim().length < 5) {
      return NextResponse.json({ error: "최소 5자 이상 입력해 주세요." }, { status: 400 });
    }

    const emotion = await analyzeEmotion(text);

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id ?? token?.sub) as string | undefined;

    prisma.emotionLog.create({
      data: {
        userId: userId ?? null,
        joy: emotion.joy,
        sadness: emotion.sadness,
        stress: emotion.stress,
        fatigue: emotion.fatigue,
        excitement: emotion.excitement,
        rawText: text,
      },
    }).catch(e => console.error("[analyze-emotion] emotionLog 저장 실패:", e));

    return NextResponse.json(emotion);
  } catch (error) {
    console.error("[analyze-emotion]", error);
    return NextResponse.json({ error: "감정 분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
