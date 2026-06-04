import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { recommendCocktails } from "@/server/ai/recommendCocktails";
import { prisma } from "@/shared/lib/prisma";
import type { EmotionVector } from "@/shared/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { emotionVector: EmotionVector; drinkingCapacity?: string };
    const { emotionVector, drinkingCapacity: capacityFromBody } = body;

    if (!emotionVector) {
      return NextResponse.json({ error: "emotionVector는 필수입니다." }, { status: 400 });
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id ?? token?.sub) as string | undefined;

    // 로그인 유저: drinkingCapacity를 DB에서 가져옴 (온보딩에서 이미 설정됨)
    // 비로그인 유저: 감정 플로우 step 5에서 받은 값 사용
    const drinkingCapacity = userId ? undefined : capacityFromBody;

    const recommendations = await recommendCocktails({ emotionVector, userId, drinkingCapacity });

    if (userId && recommendations.length > 0) {
      await prisma.recommendation.createMany({
        data: recommendations.map((r) => ({
          userId,
          cocktailId: r.id,
          score: r.score,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("[recommend]", error);
    return NextResponse.json({ error: "칵테일 추천 중 오류가 발생했습니다." }, { status: 500 });
  }
}
