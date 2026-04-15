import Anthropic from "@anthropic-ai/sdk";
import type { CocktailVector } from "@/shared/types";

const client = new Anthropic();

const SYSTEM_PROMPT = `칵테일 이름과 설명을 보고 맛 프로파일을 분석하세요.
반드시 JSON만 반환하세요.

{
  "sweetness": 0.0~1.0,
  "sourness": 0.0~1.0,
  "bitterness": 0.0~1.0,
  "strength": 0.0~1.0,
  "freshness": 0.0~1.0
}`;

const FALLBACK_VECTOR: CocktailVector = {
  sweetness: 0.5,
  sourness: 0.3,
  bitterness: 0.3,
  strength: 0.4,
  freshness: 0.4,
};

export async function inferCocktailVector(
  name: string,
  description?: string
): Promise<CocktailVector> {
  const userMessage = description
    ? `칵테일 이름: ${name}\n설명: ${description}`
    : `칵테일 이름: ${name}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const rawContent = message.content[0];
  if (rawContent.type !== "text") return FALLBACK_VECTOR;

  try {
    const parsed = JSON.parse(rawContent.text) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "sweetness" in parsed &&
      "sourness" in parsed &&
      "bitterness" in parsed &&
      "strength" in parsed &&
      "freshness" in parsed
    ) {
      return parsed as CocktailVector;
    }

    return FALLBACK_VECTOR;
  } catch {
    return FALLBACK_VECTOR;
  }
}
