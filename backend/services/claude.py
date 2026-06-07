import os
import json
import httpx

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)

PROMPT_TEMPLATE = """당신은 한국 칵테일 바(Bar) 전문 큐레이터입니다. 바의 이름, 주소, 리뷰를 분석해서 반드시 JSON만 반환하세요.

반환 형식:
{{
  "moodTags": ["조용한"|"활기찬"|"로맨틱"|"힙한"|"클래식" 중 1~2개],
  "purposeTags": ["혼술"|"데이트"|"친구모임"|"비즈니스" 중 1~2개],
  "cocktailStyles": ["달콤한"|"신"|"쓴"|"강한"|"가벼운" 중 1~2개],
  "signature": "대표 칵테일명 또는 null",
  "description": "바 분위기 한 줄 소개 (20자 이내, 한국어)"
}}

분석 기준:
- 이름/리뷰에 Jazz, Music, Vinyl → 클래식, 혼술, 쓴
- 이름/리뷰에 Party, Night → 활기찬, 친구모임, 달콤한
- 이름/리뷰에 Wine, Rose → 로맨틱, 데이트, 달콤한
- 이름/리뷰에 Craft, Hip → 힙한, 친구모임, 신
- 리뷰에 조용, 혼자, 분위기 → 조용한, 혼술
- 리뷰에 데이트, 커플 → 로맨틱, 데이트
- 리뷰에 위스키, 버번 → 쓴, 강한
- 다양한 바에 다양한 태그를 부여하세요.

바 이름: {name}
주소: {address}

리뷰:
{reviews}"""


async def analyze_bar(name: str, address: str, reviews: list[str]) -> dict:
    """Gemini API로 바 분위기/목적/칵테일 스타일 분석"""
    review_text = "\n---\n".join(reviews[:5]) if reviews else "리뷰 없음"
    prompt = PROMPT_TEMPLATE.format(name=name, address=address, reviews=review_text)

    fallback = {
        "moodTags": ["클래식"],
        "purposeTags": ["혼술"],
        "cocktailStyles": ["가벼운"],
        "signature": None,
        "description": f"{name[:15]} — 칵테일 바",
    }

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                GEMINI_URL,
                params={"key": GEMINI_API_KEY},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"},
                },
                timeout=15,
            )
            res.raise_for_status()
            text = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            cleaned = text.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)
    except Exception:
        return fallback
