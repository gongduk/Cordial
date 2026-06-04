import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import type { BarSurvey, RecommendedBar } from "@/shared/types";

const COCKTAIL_STYLE_TO_MOOD: Record<string, string[]> = {
  달콤한: ["로맨틱", "활기찬"],
  신: ["활기찬", "힙한"],
  쓴: ["클래식", "조용한"],
  강한: ["클래식", "힙한"],
  가벼운: ["조용한", "로맨틱"],
};

const BUDGET_TO_PRICE: Record<string, number[]> = {
  "3만원 이하": [1, 2],
  "3~5만원": [2, 3],
  "5만원 이상": [3, 4],
};

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreBar(
  bar: { moodTags: string[]; purposeTags: string[]; priceLevel: number | null; latitude: number | null; longitude: number | null },
  survey: BarSurvey,
  userLat: number,
  userLng: number
): { score: number; matchReasons: string[] } {
  const matchReasons: string[] = [];

  // 분위기 매칭 40%
  const moodMatch = bar.moodTags.includes(survey.mood) ? 1 : 0;
  if (moodMatch) matchReasons.push(`${survey.mood} 분위기`);

  // 칵테일 스타일 → 분위기 연계 30%
  const preferredMoods = COCKTAIL_STYLE_TO_MOOD[survey.cocktailStyle] ?? [];
  const styleOverlap = bar.moodTags.filter((t) => preferredMoods.includes(t)).length;
  const styleScore = Math.min(styleOverlap / preferredMoods.length, 1);
  if (styleScore > 0) matchReasons.push(`${survey.cocktailStyle} 칵테일 스타일`);

  // 방문 목적 20%
  const purposeMatch = bar.purposeTags.includes(survey.purpose) ? 1 : 0;
  if (purposeMatch) matchReasons.push(`${survey.purpose}에 적합`);

  // 거리 10%
  const distanceKm =
    bar.latitude && bar.longitude
      ? calcDistance(userLat, userLng, bar.latitude, bar.longitude)
      : 999;
  const distanceScore = Math.max(0, 1 - distanceKm / 5);

  // 예산 보너스 (필터 역할)
  const budgetLevels = BUDGET_TO_PRICE[survey.budget] ?? [1, 2, 3, 4];
  const budgetOk = bar.priceLevel == null || budgetLevels.includes(bar.priceLevel);
  if (!budgetOk) return { score: 0, matchReasons: [] };

  const score = moodMatch * 0.4 + styleScore * 0.3 + purposeMatch * 0.2 + distanceScore * 0.1;

  return { score, matchReasons };
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, survey } = await req.json() as {
      lat: number;
      lng: number;
      survey: BarSurvey;
    };

    if (!lat || !lng || !survey) {
      return NextResponse.json({ error: "위치와 설문 응답이 필요합니다." }, { status: 400 });
    }

    const bars = await prisma.bar.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    const scored = bars
      .map((bar) => {
        const { score, matchReasons } = scoreBar(bar, survey, lat, lng);
        const distanceKm =
          bar.latitude && bar.longitude
            ? calcDistance(lat, lng, bar.latitude, bar.longitude)
            : 999;
        return {
          id: bar.id,
          name: bar.name,
          address: bar.address,
          area: bar.area,
          moodTags: bar.moodTags,
          purposeTags: bar.purposeTags,
          signature: bar.signature,
          imageUrl: bar.imageUrl,
          description: bar.description,
          latitude: bar.latitude,
          longitude: bar.longitude,
          rating: bar.rating,
          priceLevel: bar.priceLevel,
          placeId: bar.placeId,
          score,
          distanceKm: Math.round(distanceKm * 10) / 10,
          matchReasons,
        } satisfies RecommendedBar;
      })
      .filter((b) => b.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json(scored);
  } catch (error) {
    console.error("[bars/recommend POST]", error);
    return NextResponse.json({ error: "추천 계산에 실패했습니다." }, { status: 500 });
  }
}
