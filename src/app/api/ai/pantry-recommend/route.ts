import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { pantryRecommend } from "@/server/ai/pantryRecommend";
import { checkInternalSecret } from "@/shared/lib/internalAuth";
import { checkRateLimit } from "@/shared/lib/rateLimit";

export async function POST(req: NextRequest) {
  const authError = checkInternalSecret(req);
  if (authError) return authError;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = (token as { email?: string } | null)?.email;
  const rateLimitError = await checkRateLimit(req, "pantry-recommend", email);
  if (rateLimitError) return rateLimitError;

  try {
    const { ingredients } = await req.json() as { ingredients: string[] };

    if (!Array.isArray(ingredients)) {
      return NextResponse.json({ error: "ingredients 배열이 필요합니다." }, { status: 400 });
    }

    const validIngredients = ingredients
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .slice(0, 100);

    const userId = (token?.id ?? token?.sub) as string | undefined;

    const result = await pantryRecommend(validIngredients, userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[pantry-recommend]", error);
    return NextResponse.json({ error: "재료 매칭 중 오류가 발생했습니다." }, { status: 500 });
  }
}
