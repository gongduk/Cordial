import { GoogleGenerativeAI } from "@google/generative-ai";
import type { MixIngredient, MixMethod, MixAnalysisResult, CocktailVector } from "@/shared/types";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
const genAI = new GoogleGenerativeAI(apiKey);

const DILUTION_RATES: Record<MixMethod, number> = {
  shaking: 0.30,
  stirring: 0.225,
  build: 0.125,
  blending: 0.35,
  neat: 0,
  floating: 0.05,
};

const TASTE_AROMA_PROMPT = `당신은 전문 바텐더입니다. 칵테일 재료와 계산된 도수를 바탕으로 맛 프로파일과 향을 정확하게 분석하세요. 반드시 JSON만 반환하세요.

규칙:
- sweetness/sourness/bitterness/strength/freshness는 0.0~1.0 사이 실수
- 재료 특성을 정확하게 반영할 것 (예: 미도리=멜론 리큐어로 달콤함 높음, 사워믹스=신맛+달콤함 높음, 캄파리=쓴맛 높음)
- strength는 계산된 ABV 기준 (ABV 40%=1.0, 20%=0.5, 10%=0.25 수준)
- description: 이 칵테일의 첫 모금(산미·단맛·향의 첫 인상), 중간 맛(재료의 풍미 전개), 마무리(여운)를 구체적으로 묘사. 재료명(예: 멜론, 위스키, 캄파리 등)을 직접 언급하며 생동감 있게 2~3문장으로 작성. 한국어로.
- aroma: 지배적인 향 1~2가지를 구체적으로 (예: "멜론의 달콤한 향과 시트러스의 새콤함이 어우러져요."). 한국어로.
- suggestedName: 칵테일 이름 (한국어 또는 영어)

{
  "sweetness": 0.0~1.0,
  "sourness": 0.0~1.0,
  "bitterness": 0.0~1.0,
  "strength": 0.0~1.0,
  "freshness": 0.0~1.0,
  "aroma": "향 설명",
  "description": "2~3문장 맛 묘사",
  "suggestedName": "이름"
}`;

export function calculateAbv(ingredients: MixIngredient[], method: MixMethod): number {
  const totalVolume = ingredients.reduce((s, i) => s + i.amount, 0);
  if (totalVolume === 0) return 0;

  const baseAbv =
    ingredients.reduce((s, i) => s + i.amount * i.abv, 0) / totalVolume;

  const dilutionRate = DILUTION_RATES[method];
  return Math.round(baseAbv * (1 - dilutionRate) * 10) / 10;
}

// 재료 이름 키워드 → 맛 기여값 (규칙 기반)
function ruleBased(ingredients: MixIngredient[], calculatedAbv: number): MixAnalysisResult {
  const totalVol = ingredients.reduce((s, i) => s + i.amount, 0) || 1;

  let sw = 0, so = 0, bi = 0, fr = 0;

  for (const ing of ingredients) {
    const w = ing.amount / totalVol; // 비중
    const n = ing.name.toLowerCase();

    // 단맛
    if (/미도리|멜론 리큐어|멜론리큐어/.test(n)) { sw += w * 0.9; fr += w * 0.3; }
    else if (/시럽|슈거|설탕|그레나딘|아마레토|베일리|리큐|코인트로|코앵|아페롤|피치|멜론|코코넛/.test(n)) sw += w * 0.8;
    else if (/오렌지 주스|파인애플 주스|망고|패션/.test(n)) sw += w * 0.55;
    else if (/주스/.test(n)) sw += w * 0.2;

    // 단맛+신맛 복합 재료
    if (/사워 믹스|스윗 앤 사워|sweet.*sour|사워믹스/.test(n)) { sw += w * 0.55; so += w * 0.75; }

    // 신맛
    if (/레몬 주스|라임 주스|레몬|라임/.test(n)) so += w * 0.85;
    else if (/자몽|그레이프프루트|크랜베리/.test(n)) so += w * 0.6;
    else if (/식초|사이다/.test(n)) so += w * 0.4;

    // 쓴맛
    if (/비터스|앙고스투라|캄파리|아페롤|압생트/.test(n)) bi += w * 0.9;
    else if (/드라이 베르무트|베르무트/.test(n)) bi += w * 0.35;
    else if (/스타우트|에일|맥주/.test(n)) bi += w * 0.4;

    // 상쾌함
    if (/민트|소다|탄산|진저비어|진저에일|소다수/.test(n)) fr += w * 0.85;
    else if (/라임 주스|레몬 주스|자몽/.test(n)) fr += w * 0.5;
    else if (/오이|바질|허브/.test(n)) fr += w * 0.6;
  }

  const strength = Math.min(calculatedAbv / 45, 1);

  // 주재료 이름으로 칵테일 이름 추론
  const spirits = ingredients
    .filter(i => i.abv >= 20)
    .sort((a, b) => b.amount - a.amount);

  const mainSpirit = spirits[0]?.name ?? "나만의 칵테일";

  const allNames = ingredients.map(i => i.name.toLowerCase()).join(" ");
  const hasMint = /민트/.test(allNames);
  const hasSoda = /소다|탄산/.test(allNames);

  const suggestedName = (() => {
    if (spirits.length === 0) return "나만의 목테일";
    const n = mainSpirit.toLowerCase();
    if (n.includes("미도리")) return so > 0.3 ? "미도리 사워" : "미도리 스페셜";
    if (n.includes("진")) return so > 0.3 ? "진 사워" : fr > 0.4 ? "진 토닉" : "진 스페셜";
    if (n.includes("보드카")) return fr > 0.4 ? "보드카 소다" : "보드카 스페셜";
    if (n.includes("럼")) {
      if (hasMint && hasSoda) return "모히토 스타일";
      return so > 0.3 ? "다이키리 스타일" : "럼 스페셜";
    }
    if (n.includes("위스키")) return bi > 0.4 ? "위스키 사워" : hasSoda ? "위스키 하이볼" : "위스키 스페셜";
    if (n.includes("테킬라")) return so > 0.15 ? "마르가리타 스타일" : "테킬라 스페셜";
    return `${mainSpirit} 스페셜`;
  })();

  const description = (() => {
    const firstSip: string[] = [];
    const mid: string[] = [];
    const finish: string[] = [];

    if (so > 0.5) firstSip.push("새콤한 산미가 혀끝을 깨우며");
    else if (sw > 0.5) firstSip.push("달콤한 향이 먼저 코끝에 닿고");
    else if (fr > 0.5) firstSip.push("청량한 기운이 입 안 가득 퍼지며");
    else if (bi > 0.4) firstSip.push("쌉쌀한 첫 인상이 인상적이며");
    else firstSip.push("부드럽게 시작되는 첫 모금이");

    if (sw > 0.3 && so > 0.2) mid.push("단맛과 신맛이 균형 있게 어우러집니다");
    else if (sw > 0.4) mid.push("중간에 달콤함이 은은하게 퍼집니다");
    else if (bi > 0.3) mid.push("쌉쌀한 복합미가 깊이를 더합니다");
    else if (fr > 0.4) mid.push("청량감이 중심을 잡아줍니다");
    else mid.push("재료들의 풍미가 자연스럽게 이어집니다");

    if (strength > 0.6) finish.push("강렬한 여운이 오래 남는 칵테일로");
    else if (fr > 0.4) finish.push("깔끔하게 마무리되는 칵테일로");
    else if (sw > 0.4) finish.push("달콤한 여운이 기분 좋게 남는 칵테일로");
    else finish.push("균형 잡힌 여운이 남는 칵테일로");

    const occasion = strength > 0.6
      ? "특별한 날 분위기를 끌어올릴 때 잘 어울립니다."
      : fr > 0.4
      ? "더운 날 오후나 가벼운 저녁 자리에 잘 어울립니다."
      : sw > 0.4
      ? "달콤한 마무리가 필요한 저녁에 제격입니다."
      : "어떤 자리에서도 부담 없이 즐길 수 있습니다.";

    return `${firstSip[0]} ${mid[0]}. ${finish[0]} ${occasion}`;
  })();

  const aroma = (() => {
    const aromas: string[] = [];
    if (/민트/.test(ingredients.map(i => i.name).join(" "))) aromas.push("민트의 청량감");
    if (/라임|레몬/.test(ingredients.map(i => i.name).join(" "))) aromas.push("시트러스 향");
    if (/오렌지/.test(ingredients.map(i => i.name).join(" "))) aromas.push("오렌지 향");
    if (spirits.length > 0 && spirits[0].abv >= 35) aromas.push("알코올의 따뜻한 기운");
    return aromas.length > 0 ? aromas.join(", ") + "이 느껴져요." : "재료가 어우러진 복합적인 향이에요.";
  })();

  return {
    calculatedAbv,
    taste: {
      sweetness: Math.min(sw, 1),
      sourness: Math.min(so, 1),
      bitterness: Math.min(bi, 1),
      strength,
      freshness: Math.min(fr, 1),
    },
    aroma,
    description,
    name: suggestedName,
  };
}

export async function mixAnalyze(
  ingredients: MixIngredient[],
  method: MixMethod,
  notes?: string
): Promise<MixAnalysisResult> {
  const calculatedAbv = calculateAbv(ingredients, method);

  if (ingredients.length === 0) {
    return ruleBased([], calculatedAbv);
  }

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
      `재료: ${ingredientDesc}\n제조법: ${method}\n총 볼륨: ${ingredients.reduce((s, i) => s + i.amount, 0)}ml\n계산된 도수: ${calculatedAbv}%${notes ? `\n메모: ${notes}` : ""}`
    );

    const parsed = JSON.parse(result.response.text()) as unknown;
    if (typeof parsed !== "object" || parsed === null) return ruleBased(ingredients, calculatedAbv);

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
    // Gemini 실패(쿼터 초과 등) 시 규칙 기반 분석으로 fallback
    return ruleBased(ingredients, calculatedAbv);
  }
}
