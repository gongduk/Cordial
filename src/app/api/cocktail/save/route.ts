import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/shared/lib/prisma";

interface SaveBody {
  name: string;
  description: string;
  method: string;
  ingredients: Array<{ name: string; amount: number; abv: number }>;
  taste: {
    sweetness: number;
    sourness: number;
    bitterness: number;
    strength: number;
    freshness: number;
  };
  abv: number;
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = (token?.id ?? token?.sub) as string | undefined;
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    const body = await req.json() as SaveBody;

    if (!body.name || !body.ingredients?.length) {
      return NextResponse.json({ error: "이름과 재료가 필요합니다." }, { status: 400 });
    }

    const ingredientRecords = await Promise.all(
      body.ingredients.map((ing) =>
        prisma.ingredient.upsert({
          where: { name: ing.name },
          create: { name: ing.name, abv: ing.abv },
          update: {},
        })
      )
    );

    const cocktail = await prisma.cocktail.create({
      data: {
        name: body.name,
        description: body.description,
        method: body.method,
        category: "커스텀",
        isCustom: true,
        createdBy: userId,
        abv: body.abv,
        sweetness: body.taste.sweetness,
        sourness: body.taste.sourness,
        bitterness: body.taste.bitterness,
        strength: body.taste.strength,
        freshness: body.taste.freshness,
        popularity: 0,
        ingredients: {
          create: body.ingredients.map((ing, i) => ({
            ingredientId: ingredientRecords[i].id,
            amount: `${ing.amount}ml`,
          })),
        },
      },
    });

    return NextResponse.json({ id: cocktail.id, name: cocktail.name });
  } catch (error) {
    console.error("[cocktail save]", error);
    return NextResponse.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
