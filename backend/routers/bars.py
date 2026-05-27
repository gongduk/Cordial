import re
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from services.naver import search_local, search_blog, search_image
from services.claude import analyze_bar
from services.database import upsert_bar, get_bars

router = APIRouter(prefix="/bars", tags=["bars"])


class PipelineRequest(BaseModel):
    query: str
    area: str | None = None
    count: int = 10


class BarListQuery(BaseModel):
    area: str | None = None
    mood: str | None = None


def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text)


async def process_bar(item: dict) -> dict | None:
    """단일 바 처리: 이미지 + 블로그 + Claude 분석 → DB 저장"""
    name = strip_html(item.get("title", ""))
    address = item.get("roadAddress") or item.get("address", "")
    if not name or not address:
        return None

    area = address.split(" ")[1] if len(address.split(" ")) > 1 else None

    blog_items = await search_blog(f"{name} 칵테일 후기")
    blog_texts = [strip_html(b.get("description", "")) for b in blog_items]
    image_url = await search_image(f"{name} 바 인테리어")

    analysis = await analyze_bar(name, address, blog_texts)

    bar_data = {
        "name": name,
        "address": address,
        "area": area,
        "moodTags": analysis.get("moodTags", []),
        "signature": analysis.get("signature"),
        "imageUrl": image_url,
        "description": analysis.get("description"),
    }

    return await upsert_bar(bar_data)


@router.post("/pipeline")
async def run_pipeline(req: PipelineRequest, background_tasks: BackgroundTasks):
    """네이버 검색 → Claude 분석 → Supabase 저장 파이프라인"""
    query = req.query or f"{req.area or '서울'} 칵테일바"
    items = await search_local(query, display=min(req.count, 20))

    if not items:
        raise HTTPException(status_code=404, detail="검색 결과가 없습니다.")

    results = []
    for item in items:
        bar = await process_bar(item)
        if bar:
            results.append(bar)

    return {"processed": len(results), "bars": results}


@router.get("/")
async def list_bars(area: str | None = None, mood: str | None = None):
    """저장된 바 목록 조회"""
    bars = await get_bars(area=area, mood=mood)
    return bars
