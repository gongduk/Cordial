import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/shared/lib/prisma";
import type { EmotionVector, CocktailVector, RecommendedCocktail } from "@/shared/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const DESCRIPTION_PROMPT = `당신은 감성적인 바텐더입니다. 고객의 감정 상태와 추천 칵테일을 바탕으로
따뜻하고 시적인 추천 설명을 2~3문장으로 작성하세요. 한국어로 작성하세요.`;

function emotionToVector(e: EmotionVector): CocktailVector {
  return {
    // joy·sadness → sweet (comfort), low excitement → more sweet
    sweetness: e.joy * 0.35 + e.sadness * 0.40 + (1 - e.excitement) * 0.15 + (1 - e.stress) * 0.10,
    // excitement·joy → bright/sour, low fatigue → more sour
    sourness: e.excitement * 0.50 + e.joy * 0.25 + (1 - e.fatigue) * 0.25,
    // stress·sadness·fatigue → bitter
    bitterness: e.stress * 0.45 + e.sadness * 0.30 + e.fatigue * 0.25,
    // stress·excitement → strong, low fatigue → slightly stronger
    strength: e.stress * 0.40 + e.excitement * 0.35 + e.joy * 0.15 + (1 - e.fatigue) * 0.10,
    // low stress·fatigue → fresh, excitement → fresh
    freshness: (1 - e.stress) * 0.35 + (1 - e.fatigue) * 0.35 + e.excitement * 0.20 + (1 - e.sadness) * 0.10,
  };
}

function euclideanSim(a: CocktailVector, b: CocktailVector): number {
  const keys: (keyof CocktailVector)[] = ["sweetness", "sourness", "bitterness", "strength", "freshness"];
  const dist = Math.sqrt(keys.reduce((s, k) => s + (a[k] - b[k]) ** 2, 0));
  return 1 / (1 + dist);
}

function volumeFitScore(capacity: string, strength: number): number {
  if (capacity === "LOW") return strength < 0.4 ? 1 : strength < 0.6 ? 0.5 : 0.1;
  if (capacity === "HIGH") return strength > 0.6 ? 1 : strength > 0.4 ? 0.6 : 0.3;
  return 1 - Math.abs(strength - 0.5);
}

async function generateDescription(name: string, emotion: EmotionVector): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: DESCRIPTION_PROMPT,
    });
    const result = await model.generateContent(
      `감정: ${JSON.stringify(emotion)}\n칵테일: ${name}`
    );
    return result.response.text() || `${name}을(를) 추천드립니다.`;
  } catch {
    return `${name}을(를) 추천드립니다.`;
  }
}

interface RecommendOptions {
  emotionVector: EmotionVector;
  userId?: string;
}

export async function recommendCocktails({
  emotionVector,
  userId,
}: RecommendOptions): Promise<RecommendedCocktail[]> {
  const [cocktails, user, pastRecs] = await Promise.all([
    prisma.cocktail.findMany(),
    userId ? prisma.user.findUnique({ where: { id: userId } }) : null,
    userId
      ? prisma.recommendation.findMany({
          where: { userId },
          include: { cocktail: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : [],
  ]);

  if (cocktails.length === 0) return [];

  const keys: (keyof CocktailVector)[] = ["sweetness", "sourness", "bitterness", "strength", "freshness"];

  // Scale emotion-derived target to match actual cocktail vector distribution.
  // emotionToVector outputs [0,1] per dimension, but cocktail vectors have much
  // narrower ranges (e.g. sourness max ~0.37). Without scaling, cosine similarity
  // ignores magnitude and always returns the same 3 cocktails regardless of emotion.
  const maxPerDim = keys.reduce<Record<keyof CocktailVector, number>>(
    (acc, k) => { acc[k] = Math.max(...cocktails.map(c => c[k])); return acc; },
    { sweetness: 1, sourness: 1, bitterness: 1, strength: 1, freshness: 1 }
  );
  const rawTarget = emotionToVector(emotionVector);
  const targetVector: CocktailVector = {
    sweetness:  rawTarget.sweetness  * maxPerDim.sweetness,
    sourness:   rawTarget.sourness   * maxPerDim.sourness,
    bitterness: rawTarget.bitterness * maxPerDim.bitterness,
    strength:   rawTarget.strength   * maxPerDim.strength,
    freshness:  rawTarget.freshness  * maxPerDim.freshness,
  };

  const userPrefVector: CocktailVector | null = user
    ? {
        sweetness: user.sweetPref,
        sourness: user.sourPref,
        bitterness: user.bitterPref,
        strength: user.strongPref,
        freshness: user.freshPref,
      }
    : null;

  const pastAvgVector: CocktailVector | null =
    pastRecs.length > 0
      ? (() => {
          const avg = (key: keyof CocktailVector) =>
            pastRecs.reduce((s, r) => s + r.cocktail[key], 0) / pastRecs.length;
          return {
            sweetness: avg("sweetness"),
            sourness: avg("sourness"),
            bitterness: avg("bitterness"),
            strength: avg("strength"),
            freshness: avg("freshness"),
          };
        })()
      : null;

  const ranked = cocktails
    .map((c) => {
      const cv: CocktailVector = {
        sweetness: c.sweetness,
        sourness: c.sourness,
        bitterness: c.bitterness,
        strength: c.strength,
        freshness: c.freshness,
      };

      const emotionSim = euclideanSim(targetVector, cv);
      const popularity = c.popularity;

      let score: number;
      if (user && userPrefVector) {
        const tasteSim = euclideanSim(userPrefVector, cv);
        const volumeFit = volumeFitScore(user.drinkingCapacity, c.strength);
        const pastSim = pastAvgVector ? euclideanSim(pastAvgVector, cv) : 0;
        score =
          0.4 * emotionSim +
          0.2 * tasteSim +
          0.15 * volumeFit +
          0.15 * pastSim +
          0.1 * popularity;
      } else {
        score = (0.4 * emotionSim + 0.1 * popularity) / 0.5;
      }

      return { ...c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const results = await Promise.allSettled(
    ranked.map(async (c) => {
      const aiDescription = await generateDescription(c.name, emotionVector);
      return { ...c, aiDescription } as RecommendedCocktail;
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<RecommendedCocktail> => r.status === "fulfilled")
    .map((r) => r.value);
}
