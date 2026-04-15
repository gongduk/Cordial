import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";

// GET /api/cocktails/[storeId] — 가게 칵테일 목록
export async function GET(_req: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const cocktails = await prisma.cocktail.findMany({
      where: { storeId: params.storeId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(cocktails);
  } catch (error) {
    console.error("[cocktails GET]", error);
    return NextResponse.json({ error: "칵테일 목록 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST /api/cocktails/[storeId] — 칵테일 등록 (점주)
export async function POST(req: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const body = await req.json();
    const { name, description, price, imageUrl, sweetness, sourness, bitterness, strength, freshness } = body;

    const cocktail = await prisma.cocktail.create({
      data: {
        storeId: params.storeId,
        name,
        description,
        price,
        imageUrl,
        sweetness: sweetness ?? 0,
        sourness: sourness ?? 0,
        bitterness: bitterness ?? 0,
        strength: strength ?? 0,
        freshness: freshness ?? 0,
      },
    });

    return NextResponse.json(cocktail, { status: 201 });
  } catch (error) {
    console.error("[cocktails POST]", error);
    return NextResponse.json({ error: "칵테일 등록 중 오류가 발생했습니다." }, { status: 500 });
  }
}
