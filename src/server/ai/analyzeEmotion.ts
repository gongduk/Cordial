import Anthropic from "@anthropic-ai/sdk";
import type { EmotionVector } from "@/shared/types";

const client = new Anthropic();

const SYSTEM_PROMPT = `당신은 사용자의 텍스트에서 현재 감정 상태를 분석하는 전문가입니다.
입력된 텍스트를 분석하여 다음 5가지 감정 차원의 강도를 0과 1 사이의 소수로 표현하세요.
반드시 JSON만 반환하고 다른 텍스트는 포함하지 마세요.

{
  "happy": 0.0~1.0,
  "calm": 0.0~1.0,
  "excited": 0.0~1.0,
  "tired": 0.0~1.0,
  "stressed": 0.0~1.0
}`;

const FALLBACK_EMOTION: EmotionVector = {
  happy: 0.5,
  calm: 0.5,
  excited: 0.3,
  tired: 0.2,
  stressed: 0.2,
};

export async function analyzeEmotion(text: string): Promise<EmotionVector> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
  });

  const rawContent = message.content[0];
  if (rawContent.type !== "text") return FALLBACK_EMOTION;

  try {
    const parsed = JSON.parse(rawContent.text) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "happy" in parsed &&
      "calm" in parsed &&
      "excited" in parsed &&
      "tired" in parsed &&
      "stressed" in parsed
    ) {
      return parsed as EmotionVector;
    }

    return FALLBACK_EMOTION;
  } catch {
    return FALLBACK_EMOTION;
  }
}
