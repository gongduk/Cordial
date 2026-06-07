import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/shared/lib/prisma";
import type { BarSurvey, RecommendedBar } from "@/shared/types";

const BUDGET_TO_PRICE: Record<string, number[]> = {
  "3만원 이하": [1, 2],
  "3~5만원": [2, 3],
  "5만원 이상": [3, 4],
};

// 감정 벡터 → 선호 분위기 점수
function emotionToMoodScores(avg: { joy: number; sadness: number; stress: number; fatigue: number; excitement: number }): Record<string, number> {
  return {
    활기찬: avg.joy * 0.4 + avg.excitement * 0.6,
    힙한: avg.excitement * 0.5 + avg.joy * 0.3 + (1 - avg.fatigue) * 0.2,
    로맨틱: avg.joy * 0.4 + (1 - avg.sadness) * 0.3 + (1 - avg.stress) * 0.3,
    클래식: avg.sadness * 0.3 + (1 - avg.excitement) * 0.4 + avg.fatigue * 0.3,
    조용한: avg.fatigue * 0.4 + avg.stress * 0.3 + avg.sadness * 0.3,
  };
}

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
  bar: {
    moodTags: string[];
    purposeTags: string[];
    cocktailStyles: string[];
    priceLevel: number | null;
    rating: number | null;
    reviewCount: number | null;
    latitude: number | null;
    longitude: number | null;
  },
  survey: BarSurvey,
  userLat: number,
  userLng: number,
  emotionMoodScores: Record<string, number> | null
): { score: number; matchReasons: string[] } {
  const matchReasons: string[] = [];

  // 예산 필터 (통과 못 하면 0점)
  const budgetLevels = BUDGET_TO_PRICE[survey.budget] ?? [1, 2, 3, 4];
  const budgetOk = bar.priceLevel == null || budgetLevels.includes(bar.priceLevel);
  if (!budgetOk) return { score: 0, matchReasons: [] };

  // 분위기 매칭 30%
  const moodMatch = bar.moodTags.includes(survey.mood) ? 1 : 0;
  if (moodMatch) matchReasons.push(`${survey.mood} 분위기`);

  // 칵테일 스타일 직접 매칭 25%
  const styleMatch = bar.cocktailStyles.includes(survey.cocktailStyle) ? 1 : 0;
  if (styleMatch) matchReasons.push(`${survey.cocktailStyle} 칵테일`);

  // 방문 목적 20%
  const purposeMatch = bar.purposeTags.includes(survey.purpose) ? 1 : 0;
  if (purposeMatch) matchReasons.push(`${survey.purpose}에 적합`);

  // 거리 10%
  const distanceKm =
    bar.latitude && bar.longitude
      ? calcDistance(userLat, userLng, bar.latitude, bar.longitude)
      : 999;
  const distanceScore = Math.max(0, 1 - distanceKm / 5);

  // 평점 + 리뷰수 10%
  const ratingScore = bar.rating ? (bar.rating - 1) / 4 : 0.5;
  const reviewBonus = bar.reviewCount ? Math.min(bar.reviewCount / 100, 1) : 0;
  const popularityScore = ratingScore * 0.7 + reviewBonus * 0.3;
  if (bar.rating && bar.rating >= 4.5) matchReasons.push(`★ ${bar.rating} 고평점`);

  // 감정 기반 분위기 보너스 5%
  let emotionScore = 0;
  if (emotionMoodScores) {
    const emotionFit = bar.moodTags.reduce((acc, tag) => acc + (emotionMoodScores[tag] ?? 0), 0) / Math.max(bar.moodTags.length, 1);
    emotionScore = emotionFit;
    if (emotionFit > 0.6 && !matchReasons.some(r => r.includes("분위기"))) {
      matchReasons.push("현재 기분에 어울리는 분위기");
    }
  }

  const score =
    moodMatch * 0.30 +
    styleMatch * 0.25 +
    purposeMatch * 0.20 +
    distanceScore * 0.10 +
    popularityScore * 0.10 +
    emotionScore * 0.05;

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

    // 로그인 유저의 최근 EmotionLog 조회
    let emotionMoodScores: Record<string, number> | null = null;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.id || token?.sub) {
      const userId = (token.id ?? token.sub) as string;
      const recentLogs = await prisma.emotionLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      if (recentLogs.length > 0) {
        const avg = {
          joy: recentLogs.reduce((s, l) => s + l.joy, 0) / recentLogs.length,
          sadness: recentLogs.reduce((s, l) => s + l.sadness, 0) / recentLogs.length,
          stress: recentLogs.reduce((s, l) => s + l.stress, 0) / recentLogs.length,
          fatigue: recentLogs.reduce((s, l) => s + l.fatigue, 0) / recentLogs.length,
          excitement: recentLogs.reduce((s, l) => s + l.excitement, 0) / recentLogs.length,
        };
        emotionMoodScores = emotionToMoodScores(avg);
      }
    }

    const bars = await prisma.bar.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
    });

    const scored = bars
      .map((bar) => {
        const { score, matchReasons } = scoreBar(bar, survey, lat, lng, emotionMoodScores);
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
          cocktailStyles: bar.cocktailStyles,
          signature: bar.signature,
          imageUrl: bar.imageUrl,
          description: bar.description,
          latitude: bar.latitude,
          longitude: bar.longitude,
          rating: bar.rating,
          priceLevel: bar.priceLevel,
          reviewCount: bar.reviewCount,
          placeId: bar.placeId,
          score,
          distanceKm: Math.round(distanceKm * 10) / 10,
          matchReasons,
        } satisfies RecommendedBar;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json(scored);
  } catch (error) {
    console.error("[bars/recommend POST]", error);
    return NextResponse.json({ error: "추천 계산에 실패했습니다." }, { status: 500 });
  }
}
