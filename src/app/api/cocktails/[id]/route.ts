import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cocktail = await prisma.cocktail.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
    });

    if (!cocktail) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(cocktail);
  } catch (error) {
    console.error("[cocktail detail]", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
