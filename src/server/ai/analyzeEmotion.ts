import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EmotionVector } from "@/shared/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `사용자의 텍스트를 분석하여 현재 감정 상태를 5가지 차원으로 수치화하세요.
반드시 JSON만 반환하고 다른 텍스트는 포함하지 마세요.

{
  "joy": 0.0~1.0,
  "sadness": 0.0~1.0,
  "stress": 0.0~1.0,
  "fatigue": 0.0~1.0,
  "excitement": 0.0~1.0
}`;

const FALLBACK: EmotionVector = {
  joy: 0.4,
  sadness: 0.2,
  stress: 0.2,
  fatigue: 0.2,
  excitement: 0.3,
};

function isValidEmotion(parsed: unknown): parsed is EmotionVector {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    "joy" in parsed &&
    "sadness" in parsed &&
    "stress" in parsed &&
    "fatigue" in parsed &&
    "excitement" in parsed
  );
}

export async function analyzeEmotion(text: string): Promise<EmotionVector> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { responseMimeType: "application/json" },
    });
    const result = await model.generateContent(text);
    const parsed = JSON.parse(result.response.text()) as unknown;
    return isValidEmotion(parsed) ? parsed : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export function getDominantEmotion(emotion: EmotionVector): string {
  const labels: Record<keyof EmotionVector, string> = {
    joy: "기쁜",
    sadness: "슬픈",
    stress: "지친",
    fatigue: "피곤한",
    excitement: "설레는",
  };
  const dominant = (Object.keys(emotion) as (keyof EmotionVector)[]).reduce(
    (a, b) => (emotion[a] >= emotion[b] ? a : b)
  );
  return labels[dominant];
}
