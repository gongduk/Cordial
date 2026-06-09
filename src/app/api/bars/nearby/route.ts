import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { analyzeBar } from "@/server/ai/barAnalyze";

const CACHE_TTL_DAYS = 7;
const NEARBY_RADIUS_M = 3000;
const MIN_BARS_THRESHOLD = 8; // 이 수 미만이면 파이프라인 재실행

interface GooglePlace {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  price_level?: number;
  user_ratings_total?: number;
}

interface GooglePlaceDetail {
  reviews?: { text: string }[];
}

interface GoogleNearbyResponse {
  results: GooglePlace[];
  next_page_token?: string;
  status: string;
}

async function fetchNearbyBarsPage(lat: number, lng: number, pageToken?: string): Promise<{ results: GooglePlace[]; nextToken?: string }> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY not configured");

  let url: string;
  if (pageToken) {
    // 페이지네이션: pagetoken만으로 요청
    url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${pageToken}&key=${key}`;
  } else {
    // keyword 제거 → 모든 bar 타입 수집 (칵테일 바 아닌 곳도 Gemini가 분류)
    url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${NEARBY_RADIUS_M}&type=bar&language=ko&key=${key}`;
  }

  const res = await fetch(url);
  const data = await res.json() as GoogleNearbyResponse;
  return { results: data.results ?? [], nextToken: data.next_page_token };
}

/** 최대 2페이지(최대 40곳)까지 수집 */
async function fetchAllNearbyBars(lat: number, lng: number): Promise<GooglePlace[]> {
  const all: GooglePlace[] = [];
  const { results, nextToken } = await fetchNearbyBarsPage(lat, lng);
  all.push(...results);

  if (nextToken && all.length < 40) {
    // Google은 next_page_token 발급 후 약 2초 딜레이 필요
    await new Promise(r => setTimeout(r, 2500));
    const { results: results2 } = await fetchNearbyBarsPage(lat, lng, nextToken);
    all.push(...results2);
  }

  return all;
}

async function fetchPlaceReviews(placeId: string): Promise<string[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&language=ko&key=${key}`;
  const res = await fetch(url);
  const data = await res.json() as { result: GooglePlaceDetail };
  return (data.result?.reviews ?? []).map((r) => r.text).filter(Boolean);
}

function isStale(analyzedAt: Date | null): boolean {
  if (!analyzedAt) return true;
  return (Date.now() - analyzedAt.getTime()) / (1000 * 60 * 60 * 24) > CACHE_TTL_DAYS;
}

async function countFreshNearbyBarsInDB(lat: number, lng: number): Promise<number> {
  const delta = NEARBY_RADIUS_M / 111000;
  const staleDate = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);
  return prisma.bar.count({
    where: {
      latitude: { gte: lat - delta, lte: lat + delta },
      longitude: { gte: lng - delta, lte: lng + delta },
      analyzedAt: { gte: staleDate },
    },
  });
}

async function triggerFastAPIPipeline(lat: number, lng: number): Promise<boolean> {
  const fastapiUrl = process.env.FASTAPI_URL;
  if (!fastapiUrl) return false;
  try {
    const res = await fetch(`${fastapiUrl}/bars/pipeline/nearby`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng, radius: NEARBY_RADIUS_M, count: 40 }),
      signal: AbortSignal.timeout(120_000),
    });
    return res.ok;
  } catch (e) {
    console.error("[FastAPI pipeline] 호출 실패:", e);
    return false;
  }
}

async function runInlinePipeline(lat: number, lng: number) {
  const places = await fetchAllNearbyBars(lat, lng);
  console.log(`[bars/nearby] Google Places 수집: ${places.length}개`);

  // 병렬 처리로 최대 20개 (API 쿼터 고려)
  const targets = places.slice(0, 20);

  await Promise.all(
    targets.map(async (place) => {
      try {
        const existing = await prisma.bar.findUnique({ where: { placeId: place.place_id } });
        if (existing && !isStale(existing.analyzedAt)) return existing;

        const reviews = await fetchPlaceReviews(place.place_id);
        const analysis = await analyzeBar(place.name, place.vicinity, reviews);

        const data = {
          name: place.name,
          address: place.vicinity,
          area: place.vicinity.split(" ")[0]?.trim() ?? place.vicinity,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          placeId: place.place_id,
          rating: place.rating ?? null,
          priceLevel: place.price_level ?? null,
          reviewCount: place.user_ratings_total ?? null,
          moodTags: analysis.moodTags,
          purposeTags: analysis.purposeTags,
          cocktailStyles: analysis.cocktailStyles,
          signature: analysis.signature,
          description: analysis.description,
          analyzedAt: new Date(),
        };

        return prisma.bar.upsert({
          where: { placeId: place.place_id },
          update: data,
          create: data,
        });
      } catch (e) {
        console.error(`[bars/nearby] ${place.name} 처리 실패:`, e);
      }
    })
  );
}

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: "Google Maps API 키가 설정되지 않았습니다." }, { status: 503 });
  }

  try {
    const { lat, lng } = await req.json() as { lat: number; lng: number };
    if (!lat || !lng) {
      return NextResponse.json({ error: "위치 정보가 필요합니다." }, { status: 400 });
    }

    const nearbyCount = await countFreshNearbyBarsInDB(lat, lng);
    console.log(`[bars/nearby] 신선한 DB 캐시: ${nearbyCount}개`);

    if (nearbyCount < MIN_BARS_THRESHOLD) {
      const fastApiOk = await triggerFastAPIPipeline(lat, lng);
      if (!fastApiOk) {
        console.log("[bars/nearby] 인라인 파이프라인 실행");
        await runInlinePipeline(lat, lng);
      }
    }

    const delta = NEARBY_RADIUS_M / 111000;
    const bars = await prisma.bar.findMany({
      where: {
        latitude: { gte: lat - delta, lte: lat + delta },
        longitude: { gte: lng - delta, lte: lng + delta },
      },
      orderBy: { rating: "desc" },
      take: 30,
    });

    return NextResponse.json(bars);
  } catch (error) {
    console.error("[bars/nearby POST]", error);
    return NextResponse.json({ error: "주변 바를 불러올 수 없습니다." }, { status: 500 });
  }
}
