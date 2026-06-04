import { GoogleGenerativeAI } from "@google/generative-ai";
import type { BarMood, BarPurpose, CocktailStyle } from "@/shared/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface BarAnalysisResult {
  moodTags: BarMood[];
  purposeTags: BarPurpose[];
  signature: string | null;
  description: string;
  cocktailStyles: CocktailStyle[];
}

const ANALYZE_PROMPT = `당신은 바 전문 큐레이터입니다. 바의 이름, 주소, 리뷰를 분석해서 JSON을 반환하세요.

반환 형식:
{
  "moodTags": ["조용한"|"활기찬"|"로맨틱"|"힙한"|"클래식" 중 1~3개],
  "purposeTags": ["혼술"|"데이트"|"친구모임"|"비즈니스" 중 1~2개],
  "signature": "대표 칵테일명 또는 null",
  "description": "한 줄 소개 (30자 이내)",
  "cocktailStyles": ["달콤한"|"신"|"쓴"|"강한"|"가벼운" 중 1~2개]
}

리뷰가 없으면 이름과 주소만으로 추론하세요. 반드시 JSON만 반환하세요.`;

export async function analyzeBar(
  name: string,
  address: string,
  reviews: string[]
): Promise<BarAnalysisResult> {
  const fallback: BarAnalysisResult = {
    moodTags: ["클래식"],
    purposeTags: ["혼술"],
    signature: null,
    description: `${name} — 칵테일 바`,
    cocktailStyles: ["가벼운"],
  };

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: ANALYZE_PROMPT,
      generationConfig: { responseMimeType: "application/json" },
    });

    const reviewText = reviews.length > 0
      ? reviews.slice(0, 5).map((r, i) => `리뷰${i + 1}: ${r}`).join("\n")
      : "리뷰 없음";

    const prompt = `바 이름: ${name}\n주소: ${address}\n\n${reviewText}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const parsed = JSON.parse(text) as BarAnalysisResult;
    return {
      moodTags: parsed.moodTags ?? fallback.moodTags,
      purposeTags: parsed.purposeTags ?? fallback.purposeTags,
      signature: parsed.signature ?? null,
      description: parsed.description ?? fallback.description,
      cocktailStyles: parsed.cocktailStyles ?? fallback.cocktailStyles,
    };
  } catch {
    return fallback;
  }
}
