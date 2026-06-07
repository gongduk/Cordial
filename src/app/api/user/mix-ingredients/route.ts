import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/shared/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = (token?.id ?? token?.sub) as string | undefined;
  if (!userId) return NextResponse.json([]);

  const ingredients = await prisma.userIngredient.findMany({
    where: { userId },
    orderBy: { usedAt: "desc" },
    select: { name: true, abv: true },
  });
  return NextResponse.json(ingredients);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = (token?.id ?? token?.sub) as string | undefined;
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json() as { name: string; abv: number };
  const { name, abv } = body;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  await prisma.userIngredient.upsert({
    where: { userId_name: { userId, name } },
    create: { userId, name, abv: abv ?? 0 },
    update: { abv: abv ?? 0 },
  });

  return NextResponse.json({ ok: true });
}
