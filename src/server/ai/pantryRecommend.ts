import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/shared/lib/prisma";
import type { RecommendedCocktail } from "@/shared/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const CREATIVE_PROMPT = `당신은 창의적인 바텐더입니다. 주어진 재료로 만들 수 있는 독창적인 칵테일 레시피를 제안하세요.
반드시 JSON 형식으로 반환하세요:
{
  "name": "칵테일 이름",
  "description": "설명 (1문장)",
  "recipe": "간단한 레시피",
  "sweetness": 0.0~1.0,
  "sourness": 0.0~1.0,
  "bitterness": 0.0~1.0,
  "strength": 0.0~1.0,
  "freshness": 0.0~1.0
}`;

interface PantryMatch {
  cocktail: {
    id: string;
    name: string;
    nameEn: string | null;
    description: string | null;
    category: string | null;
    glassType: string | null;
    abv: number;
    imageUrl: string | null;
    sweetness: number;
    sourness: number;
    bitterness: number;
    strength: number;
    freshness: number;
    popularity: number;
  };
  missingIngredients: string[];
  matchRatio: number;
}

export async function pantryRecommend(ingredientNames: string[]): Promise<{
  exact: PantryMatch[];
  almost: PantryMatch[];
  creative: RecommendedCocktail | null;
}> {
  if (ingredientNames.length === 0) {
    return { exact: [], almost: [], creative: null };
  }

  const normalizedNames = ingredientNames.map((n) => n.toLowerCase().trim());

  const cocktails = await prisma.cocktail.findMany({
    include: { ingredients: { include: { ingredient: true } } },
  });

  const exact: PantryMatch[] = [];
  const almost: PantryMatch[] = [];

  for (const cocktail of cocktails) {
    const required = cocktail.ingredients.map((ci) => ci.ingredient.name.toLowerCase());
    if (required.length === 0) continue;

    const missing = required.filter(
      (r) => !normalizedNames.some((n) => n.includes(r) || r.includes(n))
    );
    const matchRatio = (required.length - missing.length) / required.length;

    const match: PantryMatch = {
      cocktail: {
        id: cocktail.id,
        name: cocktail.name,
        nameEn: cocktail.nameEn,
        description: cocktail.description,
        category: cocktail.category,
        glassType: cocktail.glassType,
        abv: cocktail.abv,
        imageUrl: cocktail.imageUrl,
        sweetness: cocktail.sweetness,
        sourness: cocktail.sourness,
        bitterness: cocktail.bitterness,
        strength: cocktail.strength,
        freshness: cocktail.freshness,
        popularity: cocktail.popularity,
      },
      missingIngredients: missing,
      matchRatio,
    };

    if (missing.length === 0) exact.push(match);
    else if (missing.length === 1) almost.push(match);
  }

  exact.sort((a, b) => b.cocktail.popularity - a.cocktail.popularity);
  almost.sort((a, b) => b.matchRatio - a.matchRatio);

  let creative: RecommendedCocktail | null = null;
  if (ingredientNames.length >= 2) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: CREATIVE_PROMPT,
        generationConfig: { responseMimeType: "application/json" },
      });

      const result = await model.generateContent(`보유 재료: ${ingredientNames.join(", ")}`);
      const parsed = JSON.parse(result.response.text()) as unknown;

      if (typeof parsed === "object" && parsed !== null && "name" in parsed) {
        const p = parsed as Record<string, unknown>;
        creative = {
          id: "creative",
          name: String(p.name ?? "창작 칵테일"),
          description: String(p.description ?? ""),
          category: "창작",
          glassType: null,
          abv: 0,
          imageUrl: null,
          sweetness: Number(p.sweetness ?? 0.5),
          sourness: Number(p.sourness ?? 0.3),
          bitterness: Number(p.bitterness ?? 0.3),
          strength: Number(p.strength ?? 0.4),
          freshness: Number(p.freshness ?? 0.4),
          popularity: 0,
          aiDescription: String(p.recipe ?? ""),
          score: 1,
        };
      }
    } catch {
      creative = null;
    }
  }

  return { exact: exact.slice(0, 5), almost: almost.slice(0, 3), creative };
}
