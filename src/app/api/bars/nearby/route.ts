import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { analyzeBar } from "@/server/ai/barAnalyze";

const CACHE_TTL_DAYS = 7;
const NEARBY_RADIUS_M = 2000;
const MIN_BARS_THRESHOLD = 3; // 이 수 미만이면 파이프라인 실행

interface GooglePlace {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  price_level?: number;
  user_ratings_total?: number;
  photos?: { photo_reference: string }[];
}

interface GooglePlaceDetail {
  reviews?: { text: string }[];
}

async function fetchNearbyBars(lat: number, lng: number): Promise<GooglePlace[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY not configured");
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${NEARBY_RADIUS_M}&type=bar&keyword=칵테일&language=ko&key=${key}`;
  const res = await fetch(url);
  const data = await res.json() as { results: GooglePlace[] };
  return data.results ?? [];
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
  const diffDays = (Date.now() - analyzedAt.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > CACHE_TTL_DAYS;
}

/** DB에서 해당 위치 반경 내 바 수 조회 */
async function countNearbyBarsInDB(lat: number, lng: number): Promise<number> {
  const delta = NEARBY_RADIUS_M / 111000; // 미터 → 위도 근사 변환
  return prisma.bar.count({
    where: {
      latitude: { gte: lat - delta, lte: lat + delta },
      longitude: { gte: lng - delta, lte: lng + delta },
    },
  });
}

/** FastAPI 파이프라인 호출 (Naver 블로그 본문 크롤링 포함) */
async function triggerFastAPIPipeline(lat: number, lng: number): Promise<boolean> {
  const fastapiUrl = process.env.FASTAPI_URL;
  if (!fastapiUrl) return false;

  try {
    const res = await fetch(`${fastapiUrl}/bars/pipeline/nearby`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng, radius: NEARBY_RADIUS_M, count: 20 }),
      signal: AbortSignal.timeout(120_000), // 2분 타임아웃
    });
    return res.ok;
  } catch (e) {
    console.error("[FastAPI pipeline] 호출 실패:", e);
    return false;
  }
}

/** FastAPI 없을 때 Next.js 인라인 파이프라인 (구글 리뷰 + Gemini만) */
async function runInlinePipeline(lat: number, lng: number) {
  const places = await fetchNearbyBars(lat, lng);

  return Promise.all(
    places.slice(0, 10).map(async (place) => {
      const existing = await prisma.bar.findUnique({ where: { placeId: place.place_id } });
      if (existing && !isStale(existing.analyzedAt)) return existing;

      const reviews = await fetchPlaceReviews(place.place_id);
      const analysis = await analyzeBar(place.name, place.vicinity, reviews);

      const data = {
        name: place.name,
        address: place.vicinity,
        area: place.vicinity.split(",")[0]?.trim() ?? place.vicinity,
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

    const nearbyCount = await countNearbyBarsInDB(lat, lng);

    if (nearbyCount < MIN_BARS_THRESHOLD) {
      // DB에 데이터 부족 → FastAPI 파이프라인 우선 시도 (블로그 크롤링 포함)
      const fastApiOk = await triggerFastAPIPipeline(lat, lng);

      if (!fastApiOk) {
        // FastAPI 없거나 실패 → 인라인 파이프라인 fallback
        console.log("[bars/nearby] FastAPI 미사용 — 인라인 파이프라인 실행");
        await runInlinePipeline(lat, lng);
      }
    }

    // DB에서 최신 결과 반환
    const delta = NEARBY_RADIUS_M / 111000;
    const bars = await prisma.bar.findMany({
      where: {
        latitude: { gte: lat - delta, lte: lat + delta },
        longitude: { gte: lng - delta, lte: lng + delta },
      },
      orderBy: { rating: "desc" },
      take: 20,
    });

    return NextResponse.json(bars);
  } catch (error) {
    console.error("[bars/nearby POST]", error);
    return NextResponse.json({ error: "주변 바를 불러올 수 없습니다." }, { status: 500 });
  }
}
