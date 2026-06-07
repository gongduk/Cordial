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

const ALL_MOODS: BarMood[] = ["조용한", "활기찬", "로맨틱", "힙한", "클래식"];
const ALL_PURPOSES: BarPurpose[] = ["혼술", "데이트", "친구모임", "비즈니스"];
const ALL_STYLES: CocktailStyle[] = ["달콤한", "신", "쓴", "강한", "가벼운"];

const ANALYZE_PROMPT = `당신은 바(Bar) 큐레이터 전문가입니다. 한국 칵테일 바를 분석해 JSON을 반환하세요.

반환 형식 (반드시 이 JSON만 반환):
{
  "moodTags": ["조용한"|"활기찬"|"로맨틱"|"힙한"|"클래식" 중 1~2개],
  "purposeTags": ["혼술"|"데이트"|"친구모임"|"비즈니스" 중 1~2개],
  "signature": "대표 칵테일명 또는 null",
  "description": "바 분위기 한 줄 소개 (20자 이내, 반드시 한국어)",
  "cocktailStyles": ["달콤한"|"신"|"쓴"|"강한"|"가벼운" 중 1~2개]
}

분석 기준:
- 이름에 "Jazz","Music","Bar" → 클래식, 혼술
- 이름에 "Lounge","럭셔리","프리미엄" → 클래식, 비즈니스
- 이름에 "Party","Club","Night" → 활기찬, 친구모임
- 이름에 "Wine","Cheese" → 로맨틱, 데이트
- 해운대/광안리 지역 → 활기찬 성향
- 리뷰에 "조용","분위기","혼자" → 조용한, 혼술
- 리뷰에 "데이트","커플","둘이" → 로맨틱, 데이트
- 리뷰에 "시끌","신나","파티" → 활기찬, 친구모임
- 리뷰에 "위스키","버번","쓴" → 쓴, 강한
- 리뷰에 "달콤","과일","트로피칼" → 달콤한
- 다양한 바에 다양한 태그를 부여하세요. 모든 바가 같은 태그를 갖지 않도록 하세요.`;

function inferFromName(name: string, address: string): Partial<BarAnalysisResult> {
  const n = name.toLowerCase();
  const a = address.toLowerCase();

  let moodTags: BarMood[] = [];
  let purposeTags: BarPurpose[] = [];
  let cocktailStyles: CocktailStyle[] = [];

  if (n.includes("jazz") || n.includes("music") || n.includes("vinyl") || n.includes("옥타브")) {
    moodTags.push("클래식"); purposeTags.push("혼술"); cocktailStyles.push("쓴");
  }
  if (n.includes("lounge") || n.includes("premium") || n.includes("프리미엄")) {
    moodTags.push("클래식"); purposeTags.push("비즈니스"); cocktailStyles.push("강한");
  }
  if (n.includes("party") || n.includes("club") || n.includes("night")) {
    moodTags.push("활기찬"); purposeTags.push("친구모임"); cocktailStyles.push("달콤한");
  }
  if (n.includes("wine") || n.includes("rose") || n.includes("로맨")) {
    moodTags.push("로맨틱"); purposeTags.push("데이트"); cocktailStyles.push("달콤한");
  }
  if (n.includes("craft") || n.includes("hip") || n.includes("루프")) {
    moodTags.push("힙한"); purposeTags.push("친구모임"); cocktailStyles.push("신");
  }
  if (a.includes("해운대") || a.includes("광안")) {
    if (moodTags.length === 0) moodTags.push("활기찬");
  }

  if (moodTags.length === 0) {
    const idx = Math.abs(name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % ALL_MOODS.length;
    moodTags.push(ALL_MOODS[idx]);
  }
  if (purposeTags.length === 0) {
    const idx = Math.abs(name.charCodeAt(0)) % ALL_PURPOSES.length;
    purposeTags.push(ALL_PURPOSES[idx]);
  }
  if (cocktailStyles.length === 0) {
    const idx = Math.abs(name.charCodeAt(name.length - 1)) % ALL_STYLES.length;
    cocktailStyles.push(ALL_STYLES[idx]);
  }

  return { moodTags, purposeTags, cocktailStyles };
}

export async function analyzeBar(
  name: string,
  address: string,
  reviews: string[]
): Promise<BarAnalysisResult> {
  const inferred = inferFromName(name, address);

  const fallback: BarAnalysisResult = {
    moodTags: inferred.moodTags ?? ["클래식"],
    purposeTags: inferred.purposeTags ?? ["혼술"],
    signature: null,
    description: `${name.slice(0, 15)} — 칵테일 바`,
    cocktailStyles: inferred.cocktailStyles ?? ["가벼운"],
  };

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const reviewText = reviews.length > 0
      ? reviews.slice(0, 5).map((r, i) => `리뷰${i + 1}: ${r}`).join("\n")
      : "리뷰 없음";

    const prompt = `${ANALYZE_PROMPT}\n\n바 이름: ${name}\n주소: ${address}\n\n${reviewText}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<BarAnalysisResult>;

    const validMoods = (parsed.moodTags ?? []).filter((t): t is BarMood => ALL_MOODS.includes(t as BarMood));
    const validPurposes = (parsed.purposeTags ?? []).filter((t): t is BarPurpose => ALL_PURPOSES.includes(t as BarPurpose));
    const validStyles = (parsed.cocktailStyles ?? []).filter((t): t is CocktailStyle => ALL_STYLES.includes(t as CocktailStyle));

    return {
      moodTags: validMoods.length > 0 ? validMoods : fallback.moodTags,
      purposeTags: validPurposes.length > 0 ? validPurposes : fallback.purposeTags,
      signature: typeof parsed.signature === "string" ? parsed.signature : null,
      description: typeof parsed.description === "string" && parsed.description.length > 0
        ? parsed.description
        : fallback.description,
      cocktailStyles: validStyles.length > 0 ? validStyles : fallback.cocktailStyles,
    };
  } catch {
    return fallback;
  }
}
