import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { SYNONYMS } from "@/shared/lib/ingredientSynonyms";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  try {
    if (q.length < 1) {
      const all = await prisma.ingredient.findMany({
        select: { id: true, name: true, nameEn: true, abv: true, category: true },
        orderBy: { name: "asc" },
        take: 30,
      });
      return NextResponse.json(all);
    }

    const terms = new Set<string>([q]);
    for (const [key, vals] of Object.entries(SYNONYMS)) {
      if (q.includes(key) || key.includes(q)) vals.forEach(v => terms.add(v));
    }

    const results = await prisma.ingredient.findMany({
      where: {
        OR: [...terms].flatMap(term => [
          { name: { contains: term, mode: "insensitive" as const } },
          { nameEn: { contains: term, mode: "insensitive" as const } },
        ]),
      },
      select: { id: true, name: true, nameEn: true, abv: true, category: true },
      orderBy: { name: "asc" },
      take: 20,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("[ingredients search]", error);
    return NextResponse.json({ error: "재료 검색 중 오류가 발생했습니다." }, { status: 500 });
  }
}
