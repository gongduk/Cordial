import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.google_maps import search_nearby_bars, search_bars_by_text, get_place_reviews, extract_bar_base
from services.gemini import analyze_bar
from services.database import upsert_bar, get_bars
from services.naver_blog import search_naver_blog_reviews
from services.instagram import search_instagram_posts

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
    """단일 Google Places 결과 처리: 구글 리뷰 + 블로그 + 인스타 병렬 수집 → Gemini 분석 → DB 저장"""
    base = extract_bar_base(place)
    if not base["name"] or not base["address"]:
        return None

    place_id = base.get("placeId")
    area = base.get("area", "")

    async def _no_reviews() -> list[str]:
        return []

    google_reviews, blog_snippets, insta_captions = await asyncio.gather(
        get_place_reviews(place_id) if place_id else _no_reviews(),
        search_naver_blog_reviews(base["name"], area),
        search_instagram_posts(base["name"], area),
    )

    analysis = await analyze_bar(
        base["name"], base["address"],
        google_reviews, blog_snippets, insta_captions,
    )

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
    """위도/경도 기반 주변 칵테일 바 수집 → Gemini 분석 → DB 저장"""
    places = await search_nearby_bars(req.lat, req.lng, req.radius)
    if not places:
        raise HTTPException(status_code=404, detail="주변에 바를 찾을 수 없습니다.")

    results = []
    for i, place in enumerate(places[:req.count]):
        bar = await process_place(place)
        if bar:
            results.append(bar)
        if (i + 1) % 5 == 0:
            await asyncio.sleep(2)  # Gemini rate limit 방지

    return {"processed": len(results), "bars": results}


@router.post("/pipeline/search")
async def pipeline_search(req: TextSearchRequest):
    """텍스트 검색 기반 칵테일 바 수집 → Gemini 분석 → DB 저장
    예: { "query": "해운대 칵테일바", "count": 20 }
    """
    places = await search_bars_by_text(req.query, req.count)
    if not places:
        raise HTTPException(status_code=404, detail="검색 결과가 없습니다.")

    results = []
    for i, place in enumerate(places):
        bar = await process_place(place)
        if bar:
            results.append(bar)
        if (i + 1) % 5 == 0:
            await asyncio.sleep(2)  # Gemini rate limit 방지

    return {"processed": len(results), "bars": results}


@router.post("/pipeline/re-analyze")
async def re_analyze_bars():
    """DB의 모든 바를 이름 기반 규칙으로 즉시 재분석 (Gemini 호출 없음)"""
    from services.gemini import infer_from_name
    from services.database import SUPABASE_URL, HEADERS
    import httpx

    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/Bar",
            headers=HEADERS,
            params={"select": "id,name,address", "limit": "200"},
            timeout=15,
        )
        bars = res.json()

    updated = 0
    async with httpx.AsyncClient() as client:
        for bar in bars:
            inferred = infer_from_name(bar["name"], bar.get("address", ""))
            patch = {
                "moodTags": inferred["moodTags"],
                "purposeTags": inferred["purposeTags"],
                "cocktailStyles": inferred["cocktailStyles"],
            }
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/Bar",
                headers={**HEADERS, "Prefer": "return=minimal"},
                params={"id": f"eq.{bar['id']}"},
                json=patch,
                timeout=10,
            )
            updated += 1

    return {"updated": updated}


@router.get("/")
async def list_bars(area: str | None = None, mood: str | None = None):
    """저장된 바 목록 조회"""
    bars = await get_bars(area=area, mood=mood)
    return bars
