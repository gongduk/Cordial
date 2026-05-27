import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/shared/lib/prisma";

async function getUserId(req: NextRequest): Promise<string | undefined> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return (token?.id ?? token?.sub) as string | undefined;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pantry: true },
  });

  return NextResponse.json({ pantry: user?.pantry ?? [] });
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await req.json() as { pantry: string[] };
  if (!Array.isArray(body.pantry)) {
    return NextResponse.json({ error: "pantry는 배열이어야 합니다." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { pantry: body.pantry },
    select: { pantry: true },
  });

  return NextResponse.json({ pantry: updated.pantry });
}
