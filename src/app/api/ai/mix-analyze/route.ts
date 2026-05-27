import { NextRequest, NextResponse } from "next/server";
import { mixAnalyze } from "@/server/ai/mixAnalyze";
import type { MixIngredient, MixMethod } from "@/shared/types";

export async function POST(req: NextRequest) {
  try {
    const { ingredients, method, notes } = await req.json() as {
      ingredients: MixIngredient[];
      method: MixMethod;
      notes?: string;
    };

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: "재료를 입력해 주세요." }, { status: 400 });
    }

    const validMethods: MixMethod[] = ["shaking", "stirring", "build", "blending", "neat", "floating"];
    if (!validMethods.includes(method)) {
      return NextResponse.json({ error: "올바른 제조법을 선택해 주세요." }, { status: 400 });
    }

    const result = await mixAnalyze(ingredients, method, notes);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[mix-analyze]", error);
    return NextResponse.json({ error: "분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
