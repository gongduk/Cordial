import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { generateAccessToken, generateRefreshToken } from "@/server/auth/tokens";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (token.id ?? token.sub) as string;
  const accessToken = generateAccessToken(userId);
  const refreshToken = await generateRefreshToken(userId);

  const res = NextResponse.json({ accessToken });
  res.cookies.set("cordial_refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
