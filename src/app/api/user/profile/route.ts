import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/shared/lib/prisma";
import type { DrinkingCapacity } from "@/shared/types";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: token.id as string },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      drinkingCapacity: true,
      sweetPref: true,
      sourPref: true,
      bitterPref: true,
      strongPref: true,
      freshPref: true,
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    const body = await req.json() as {
      drinkingCapacity?: DrinkingCapacity;
      sweetPref?: number;
      sourPref?: number;
      bitterPref?: number;
      strongPref?: number;
      freshPref?: number;
      name?: string;
    };

    const updated = await prisma.user.update({
      where: { id: token.id as string },
      data: body,
      select: {
        id: true,
        name: true,
        drinkingCapacity: true,
        sweetPref: true,
        sourPref: true,
        bitterPref: true,
        strongPref: true,
        freshPref: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[user profile PATCH]", error);
    return NextResponse.json({ error: "프로필 업데이트 중 오류가 발생했습니다." }, { status: 500 });
  }
}
