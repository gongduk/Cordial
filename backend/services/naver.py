import os
import httpx
from typing import Optional

NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")

HEADERS = {
    "X-Naver-Client-Id": NAVER_CLIENT_ID,
    "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
}


async def search_local(query: str, display: int = 5) -> list[dict]:
    """네이버 지역 검색 API - 바/술집 검색"""
    url = "https://openapi.naver.com/v1/search/local.json"
    params = {"query": query, "display": display, "sort": "comment"}

    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=HEADERS, params=params)
        res.raise_for_status()
        data = res.json()
        return data.get("items", [])


async def search_blog(query: str, display: int = 3) -> list[dict]:
    """네이버 블로그 검색 API - 바 후기/메뉴 수집"""
    url = "https://openapi.naver.com/v1/search/blog.json"
    params = {"query": query, "display": display, "sort": "sim"}

    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=HEADERS, params=params)
        res.raise_for_status()
        data = res.json()
        return data.get("items", [])


async def search_image(query: str, display: int = 1) -> Optional[str]:
    """네이버 이미지 검색 API - 가게 대표 이미지"""
    url = "https://openapi.naver.com/v1/search/image"
    params = {"query": query, "display": display, "filter": "medium"}

    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=HEADERS, params=params)
        if not res.is_success:
            return None
        items = res.json().get("items", [])
        return items[0]["link"] if items else None
