import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/shared/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = (token?.id ?? token?.sub) as string | undefined;
  if (!userId) return NextResponse.json([]);

  const recs = await prisma.recommendation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      cocktail: { select: { name: true, glassType: true } },
    },
  });

  return NextResponse.json(
    recs.map(r => ({
      id: r.id,
      cocktailName: r.cocktail.name,
      glassType: r.cocktail.glassType ?? null,
      createdAt: r.createdAt,
    }))
  );
}
