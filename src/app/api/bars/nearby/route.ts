import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import {
  NEARBY_RADIUS_M,
  countFreshNearbyBarsInDB,
  ensureFreshBars,
} from "@/server/barsPipeline";

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: "Google Maps API 키가 설정되지 않았습니다." }, { status: 503 });
  }

  try {
    const body = (await req.json()) as { lat: unknown; lng: unknown };
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!isFinite(lat) || !isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: "유효한 위치 정보가 필요합니다." }, { status: 400 });
    }

    const nearbyCount = await countFreshNearbyBarsInDB(lat, lng);
    console.log(`[bars/nearby] 신선한 DB 캐시: ${nearbyCount}개`);

    await Promise.race([
      ensureFreshBars(lat, lng),
      new Promise<void>((resolve) => setTimeout(resolve, 45_000)),
    ]).catch((e: unknown) => {
      console.error("[bars/nearby] ensureFreshBars 실패:", e);
    });

    const latDelta = NEARBY_RADIUS_M / 111000;
    const cosLat = Math.cos((lat * Math.PI) / 180);
    const lngDelta = cosLat > 0.001 ? NEARBY_RADIUS_M / (111000 * cosLat) : NEARBY_RADIUS_M / 111000;
    const bars = await prisma.bar.findMany({
      where: {
        latitude: { gte: lat - latDelta, lte: lat + latDelta },
        longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
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
