import { NextRequest, NextResponse } from "next/server";
import { recommendCocktails } from "@/server/ai/recommendCocktails";
import type { EmotionVector } from "@/shared/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, emotionVector } = body as {
      storeId: string;
      emotionVector: EmotionVector;
    };

    if (!storeId || !emotionVector) {
      return NextResponse.json({ error: "storeId와 emotionVector는 필수입니다." }, { status: 400 });
    }

    const recommendations = await recommendCocktails(storeId, emotionVector);
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("[recommend]", error);
    return NextResponse.json({ error: "칵테일 추천 중 오류가 발생했습니다." }, { status: 500 });
  }
}
