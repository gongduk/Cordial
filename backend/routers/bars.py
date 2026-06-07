from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.google_maps import search_nearby_bars, search_bars_by_text, get_place_reviews, extract_bar_base
from services.claude import analyze_bar
from services.database import upsert_bar, get_bars

router = APIRouter(prefix="/bars", tags=["bars"])


class NearbyRequest(BaseModel):
    lat: float
    lng: float
    radius: int = 2000
    count: int = 20


class TextSearchRequest(BaseModel):
    query: str          # 예: "해운대 칵테일바", "강남 스피크이지"
    count: int = 20


class BarListQuery(BaseModel):
    area: str | None = None
    mood: str | None = None


async def process_place(place: dict) -> dict | None:
    """단일 Google Places 결과 처리: 리뷰 수집 + Claude 분석 → DB 저장"""
    base = extract_bar_base(place)
    if not base["name"] or not base["address"]:
        return None

    place_id = base.get("placeId")
    reviews = await get_place_reviews(place_id) if place_id else []
    analysis = await analyze_bar(base["name"], base["address"], reviews)

    bar_data = {
        **base,
        "moodTags": analysis.get("moodTags", []),
        "purposeTags": analysis.get("purposeTags", []),
        "cocktailStyles": analysis.get("cocktailStyles", []),
        "signature": analysis.get("signature"),
        "description": analysis.get("description"),
    }

    return await upsert_bar(bar_data)


@router.post("/pipeline/nearby")
async def pipeline_nearby(req: NearbyRequest):
    """위도/경도 기반 주변 칵테일 바 수집 → Claude 분석 → DB 저장"""
    places = await search_nearby_bars(req.lat, req.lng, req.radius)
    if not places:
        raise HTTPException(status_code=404, detail="주변에 바를 찾을 수 없습니다.")

    results = []
    for place in places[:req.count]:
        bar = await process_place(place)
        if bar:
            results.append(bar)

    return {"processed": len(results), "bars": results}


@router.post("/pipeline/search")
async def pipeline_search(req: TextSearchRequest):
    """텍스트 검색 기반 칵테일 바 수집 → Claude 분석 → DB 저장
    예: { "query": "해운대 칵테일바", "count": 20 }
    """
    places = await search_bars_by_text(req.query, req.count)
    if not places:
        raise HTTPException(status_code=404, detail="검색 결과가 없습니다.")

    results = []
    for place in places:
        bar = await process_place(place)
        if bar:
            results.append(bar)

    return {"processed": len(results), "bars": results}


@router.get("/")
async def list_bars(area: str | None = None, mood: str | None = None):
    """저장된 바 목록 조회"""
    bars = await get_bars(area=area, mood=mood)
    return bars
