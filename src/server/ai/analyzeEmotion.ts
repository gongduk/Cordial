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

function inferEmotionFromText(text: string): EmotionVector {
  const t = text.toLowerCase();
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  const joy = has("기쁘", "행복", "좋아", "좋은", "신나", "즐거", "최고", "설레", "웃", "ㅋㅋ", "ㅎㅎ") ? 0.75 :
              has("그냥", "보통", "평범", "무난") ? 0.4 : 0.25;

  const sadness = has("슬프", "우울", "힘들", "외로", "그리워", "눈물", "아파", "속상", "실망") ? 0.75 :
                  has("별로", "그저", "씁쓸") ? 0.45 : 0.15;

  const stress = has("스트레스", "짜증", "힘들", "답답", "버겁", "시달", "지쳐", "못 견") ? 0.75 :
                 has("바쁘", "빡", "골치") ? 0.55 : 0.2;

  const fatigue = has("피곤", "졸리", "지쳐", "지침", "힘없", "녹초", "노곤", "몸살") ? 0.75 :
                  has("나른", "쉬고", "좀 쉬") ? 0.5 : 0.2;

  const excitement = has("설레", "두근", "기대", "떨려", "흥분", "신나", "짜릿") ? 0.8 :
                     has("기쁘", "행복", "좋아") ? 0.5 : 0.25;

  return { joy, sadness, stress, fatigue, excitement };
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
    return isValidEmotion(parsed) ? parsed : inferEmotionFromText(text);
  } catch {
    return inferEmotionFromText(text);
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
