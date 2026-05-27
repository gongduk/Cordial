import os
import json
import anthropic

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

SYSTEM_PROMPT = """당신은 바(Bar) 전문가입니다. 아래 정보를 바탕으로 해당 바의 특성을 분석하세요.
반드시 JSON만 반환하세요:

{
  "moodTags": ["태그1", "태그2", "태그3"],
  "signature": "대표 칵테일 이름",
  "description": "바 설명 (2~3문장, 한국어)"
}

moodTags는 다음 중에서 선택: 조용함, 활기참, 클래식, 모던, 로맨틱, 아늑함, 스피크이지,
한국적, 플로럴, 시즈널, 히든, 루프탑, 재즈, 위스키전문, 자연주의, 도시적"""


async def analyze_bar(name: str, address: str, blog_texts: list[str]) -> dict:
    """Claude API로 바 분위기 태그 + 대표 칵테일 분석"""
    blog_summary = "\n---\n".join(blog_texts[:3]) if blog_texts else "정보 없음"
    user_message = f"바 이름: {name}\n주소: {address}\n\n블로그 후기:\n{blog_summary}"

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        raw = message.content[0].text
        return json.loads(raw)
    except Exception:
        return {
            "moodTags": ["클래식", "아늑함"],
            "signature": None,
            "description": f"{name}은 특색 있는 바입니다.",
        }
