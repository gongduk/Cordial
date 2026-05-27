import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { pantryRecommend } from "@/server/ai/pantryRecommend";

export async function POST(req: NextRequest) {
  try {
    const { ingredients } = await req.json() as { ingredients: string[] };

    if (!Array.isArray(ingredients)) {
      return NextResponse.json({ error: "ingredients 배열이 필요합니다." }, { status: 400 });
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id ?? token?.sub) as string | undefined;

    const result = await pantryRecommend(ingredients, userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[pantry-recommend]", error);
    return NextResponse.json({ error: "재료 매칭 중 오류가 발생했습니다." }, { status: 500 });
  }
}
