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
    const { lat, lng } = (await req.json()) as { lat: number; lng: number };
    if (!lat || !lng) {
      return NextResponse.json({ error: "위치 정보가 필요합니다." }, { status: 400 });
    }

    const nearbyCount = await countFreshNearbyBarsInDB(lat, lng);
    console.log(`[bars/nearby] 신선한 DB 캐시: ${nearbyCount}개`);

    await ensureFreshBars(lat, lng);

    const latDelta = NEARBY_RADIUS_M / 111000;
    const lngDelta = NEARBY_RADIUS_M / (111000 * Math.cos((lat * Math.PI) / 180));
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
