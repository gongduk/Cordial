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

      // 감정 기반 추론 flavor 벡터로 user prefs 점진적 업데이트 (α=0.1 이동평균)
      const e = emotionVector;
      const inferredFlavor = {
        sweetness: e.joy * 0.35 + e.sadness * 0.40 + (1 - e.excitement) * 0.15 + (1 - e.stress) * 0.10,
        sourness:  e.excitement * 0.50 + e.joy * 0.25 + (1 - e.fatigue) * 0.25,
        bitterness: e.stress * 0.45 + e.sadness * 0.30 + e.fatigue * 0.25,
        strength:  e.stress * 0.40 + e.excitement * 0.35 + e.joy * 0.15 + (1 - e.fatigue) * 0.10,
        freshness: (1 - e.stress) * 0.35 + (1 - e.fatigue) * 0.35 + e.excitement * 0.20 + (1 - e.sadness) * 0.10,
      };
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { sweetPref: true, sourPref: true, bitterPref: true, strongPref: true, freshPref: true } });
      if (user) {
        const α = 0.12;
        await prisma.user.update({
          where: { id: userId },
          data: {
            sweetPref:  Math.min(1, Math.max(0, user.sweetPref  * (1 - α) + inferredFlavor.sweetness  * α)),
            sourPref:   Math.min(1, Math.max(0, user.sourPref   * (1 - α) + inferredFlavor.sourness   * α)),
            bitterPref: Math.min(1, Math.max(0, user.bitterPref * (1 - α) + inferredFlavor.bitterness * α)),
            strongPref: Math.min(1, Math.max(0, user.strongPref * (1 - α) + inferredFlavor.strength   * α)),
            freshPref:  Math.min(1, Math.max(0, user.freshPref  * (1 - α) + inferredFlavor.freshness  * α)),
          },
        });
      }
    }

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("[recommend]", error);
    return NextResponse.json({ error: "칵테일 추천 중 오류가 발생했습니다." }, { status: 500 });
  }
}
