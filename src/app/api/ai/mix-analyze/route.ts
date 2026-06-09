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

    const safeIngredients: MixIngredient[] = ingredients
      .slice(0, 30)
      .filter((i): i is MixIngredient =>
        typeof i === "object" && i !== null &&
        typeof i.name === "string" && i.name.trim().length > 0 &&
        isFinite(Number(i.amount)) && Number(i.amount) > 0 &&
        isFinite(Number(i.abv)) && Number(i.abv) >= 0 && Number(i.abv) <= 100
      )
      .map(i => ({ name: i.name.trim(), amount: Number(i.amount), abv: Number(i.abv) }));

    if (safeIngredients.length === 0) {
      return NextResponse.json({ error: "유효한 재료가 없습니다." }, { status: 400 });
    }

    const safeNotes = typeof notes === "string" ? notes.slice(0, 500) : undefined;

    const result = await mixAnalyze(safeIngredients, method, safeNotes);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[mix-analyze]", error);
    return NextResponse.json({ error: "분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
