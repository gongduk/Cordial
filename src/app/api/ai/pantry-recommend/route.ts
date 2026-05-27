import { NextRequest, NextResponse } from "next/server";
import { pantryRecommend } from "@/server/ai/pantryRecommend";

export async function POST(req: NextRequest) {
  try {
    const { ingredients } = await req.json() as { ingredients: string[] };

    if (!Array.isArray(ingredients)) {
      return NextResponse.json({ error: "ingredients 배열이 필요합니다." }, { status: 400 });
    }

    const result = await pantryRecommend(ingredients);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[pantry-recommend]", error);
    return NextResponse.json({ error: "재료 매칭 중 오류가 발생했습니다." }, { status: 500 });
  }
}
