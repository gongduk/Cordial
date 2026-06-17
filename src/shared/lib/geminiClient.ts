import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");

export const genAI = new GoogleGenerativeAI(apiKey);

export function parseGeminiJson<T>(text: string): T {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(stripped) as T;
  } catch {
    const match = stripped.match(/[\[\{][\s\S]*[\]\}]/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("Gemini JSON 파싱 실패");
  }
}
