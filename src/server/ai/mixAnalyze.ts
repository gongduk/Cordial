import { GoogleGenerativeAI } from "@google/generative-ai";
import type { MixIngredient, MixMethod, MixAnalysisResult, CocktailVector } from "@/shared/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const DILUTION_RATES: Record<MixMethod, number> = {
  shaking: 0.30,
  stirring: 0.225,
  build: 0.125,
  blending: 0.35,
  neat: 0,
};

const TASTE_AROMA_PROMPT = `당신은 전문 바텐더입니다. 칵테일 재료와 계산된 도수를 바탕으로
맛 프로파일과 향을 분석하세요. 반드시 JSON만 반환하세요.

{
  "sweetness": 0.0~1.0,
  "sourness": 0.0~1.0,
  "bitterness": 0.0~1.0,
  "strength": 0.0~1.0,
  "freshness": 0.0~1.0,
  "aroma": "향 설명 (1~2문장, 한국어)",
  "description": "전반적인 맛 설명 (1~2문장, 한국어)",
  "suggestedName": "칵테일 이름 제안 (한국어 또는 영어)"
}`;

export function calculateAbv(ingredients: MixIngredient[], method: MixMethod): number {
  const totalVolume = ingredients.reduce((s, i) => s + i.amount, 0);
  if (totalVolume === 0) return 0;

  const baseAbv =
    ingredients.reduce((s, i) => s + i.amount * i.abv, 0) / totalVolume;

  const dilutionRate = DILUTION_RATES[method];
  return Math.round(baseAbv * (1 - dilutionRate) * 10) / 10;
}

export async function mixAnalyze(
  ingredients: MixIngredient[],
  method: MixMethod,
  notes?: string
): Promise<MixAnalysisResult> {
  const calculatedAbv = calculateAbv(ingredients, method);
  const totalVolume = ingredients.reduce((s, i) => s + i.amount, 0);

  const fallback: MixAnalysisResult = {
    calculatedAbv,
    taste: { sweetness: 0.4, sourness: 0.3, bitterness: 0.2, strength: calculatedAbv / 50, freshness: 0.4 },
    aroma: "재료를 분석할 수 없습니다.",
    description: "재료를 확인해 주세요.",
    name: "나만의 칵테일",
  };

  if (ingredients.length === 0) return fallback;

  try {
    const ingredientDesc = ingredients
      .map((i) => `${i.name} ${i.amount}ml (ABV ${i.abv}%)`)
      .join(", ");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: TASTE_AROMA_PROMPT,
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(
      `재료: ${ingredientDesc}\n제조법: ${method}\n총 볼륨: ${totalVolume}ml\n계산된 도수: ${calculatedAbv}%${notes ? `\n메모: ${notes}` : ""}`
    );

    const parsed = JSON.parse(result.response.text()) as unknown;
    if (typeof parsed !== "object" || parsed === null) return fallback;

    const p = parsed as Record<string, unknown>;
    const taste: CocktailVector = {
      sweetness: Number(p.sweetness ?? 0.4),
      sourness: Number(p.sourness ?? 0.3),
      bitterness: Number(p.bitterness ?? 0.2),
      strength: Number(p.strength ?? calculatedAbv / 50),
      freshness: Number(p.freshness ?? 0.4),
    };

    return {
      calculatedAbv,
      taste,
      aroma: String(p.aroma ?? ""),
      description: String(p.description ?? ""),
      name: String(p.suggestedName ?? "나만의 칵테일"),
    };
  } catch {
    return fallback;
  }
}
