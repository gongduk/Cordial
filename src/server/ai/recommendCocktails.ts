import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/shared/lib/prisma";
import type { EmotionVector, CocktailVector, RecommendedCocktail } from "@/shared/types";

const client = new Anthropic();

const DESCRIPTION_SYSTEM_PROMPT = `당신은 바텐더입니다. 고객의 감정 상태와 추천된 칵테일 정보를 바탕으로
고객에게 맞춤형 추천 설명을 2~3문장으로 작성하세요.
따뜻하고 친근한 어조로, 왜 이 칵테일이 지금 고객에게 어울리는지 설명하세요.
한국어로 작성하세요.`;

function emotionToCocktailVector(emotion: EmotionVector): CocktailVector {
  return {
    sweetness: emotion.happy * 0.6 + emotion.excited * 0.3 + emotion.stressed * 0.1,
    sourness: emotion.excited * 0.5 + emotion.happy * 0.3 + emotion.tired * 0.2,
    bitterness: emotion.stressed * 0.4 + emotion.tired * 0.4 + emotion.calm * 0.2,
    strength: emotion.excited * 0.5 + emotion.stressed * 0.3 + emotion.happy * 0.2,
    freshness: emotion.calm * 0.5 + emotion.happy * 0.3 + emotion.tired * 0.2,
  };
}

function cosineSimilarity(a: CocktailVector, b: CocktailVector): number {
  const keys: (keyof CocktailVector)[] = [
    "sweetness",
    "sourness",
    "bitterness",
    "strength",
    "freshness",
  ];
  const dot = keys.reduce((sum, k) => sum + a[k] * b[k], 0);
  const magA = Math.sqrt(keys.reduce((sum, k) => sum + a[k] ** 2, 0));
  const magB = Math.sqrt(keys.reduce((sum, k) => sum + b[k] ** 2, 0));

  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

async function generateDescription(
  cocktailName: string,
  emotionVector: EmotionVector
): Promise<string> {
  const userMessage = `고객 감정: ${JSON.stringify(emotionVector)}\n추천 칵테일: ${cocktailName}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      system: DESCRIPTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawContent = message.content[0];
    if (rawContent.type !== "text") return `${cocktailName}을(를) 추천드립니다.`;
    return rawContent.text;
  } catch {
    return `${cocktailName}을(를) 추천드립니다.`;
  }
}

export async function recommendCocktails(
  storeId: string,
  emotionVector: EmotionVector
): Promise<RecommendedCocktail[]> {
  const cocktails = await prisma.cocktail.findMany({
    where: { storeId, isAvailable: true },
  });

  if (cocktails.length === 0) return [];

  const targetVector = emotionToCocktailVector(emotionVector);

  const ranked = cocktails
    .map((c) => ({
      ...c,
      score: cosineSimilarity(targetVector, {
        sweetness: c.sweetness,
        sourness: c.sourness,
        bitterness: c.bitterness,
        strength: c.strength,
        freshness: c.freshness,
      }),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const results: RecommendedCocktail[] = await Promise.all(
    ranked.map(async (cocktail) => {
      const aiDescription = await generateDescription(cocktail.name, emotionVector);
      return { ...cocktail, aiDescription };
    })
  );

  return results;
}
