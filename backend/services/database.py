import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def get_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


async def upsert_bar(bar_data: dict) -> dict:
    """Supabase Bar 테이블에 upsert"""
    client = get_client()
    result = (
        client.table("Bar")
        .upsert(bar_data, on_conflict="name,address")
        .execute()
    )
    return result.data[0] if result.data else {}


async def get_bars(area: str | None = None, mood: str | None = None) -> list[dict]:
    """Supabase에서 바 목록 조회"""
    client = get_client()
    query = client.table("Bar").select("*")
    if area:
        query = query.ilike("area", f"%{area}%")
    result = query.order("created_at", desc=True).limit(20).execute()
    return result.data or []
