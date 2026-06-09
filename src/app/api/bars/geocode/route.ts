import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const area = req.nextUrl.searchParams.get("area");
  if (!area) return NextResponse.json({ error: "area 파라미터가 필요합니다." }, { status: 400 });

  try {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return NextResponse.json({ error: "Google Maps API 키가 설정되지 않았습니다." }, { status: 503 });
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(area)}&language=ko&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "위치 검색 API 오류" }, { status: 502 });
    }
    const data = await res.json() as { results: { geometry: { location: { lat: number; lng: number } } }[]; status: string };

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("[bars/geocode] Google API status:", data.status);
    }
    const location = data.results?.[0]?.geometry?.location;
    if (!location) return NextResponse.json({ error: "위치를 찾을 수 없습니다." }, { status: 404 });

    return NextResponse.json({ lat: location.lat, lng: location.lng });
  } catch (error) {
    console.error("[bars/geocode GET]", error);
    return NextResponse.json({ error: "위치 검색에 실패했습니다." }, { status: 500 });
  }
}
