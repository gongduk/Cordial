import { NextRequest, NextResponse } from "next/server";
import { rotateRefreshToken } from "@/server/auth/tokens";

export async function POST(req: NextRequest) {
  const oldToken = req.cookies.get("cordial_refresh")?.value;
  if (!oldToken) return NextResponse.json({ error: "No refresh token" }, { status: 401 });

  const result = await rotateRefreshToken(oldToken);
  if (!result) return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });

  const res = NextResponse.json({ accessToken: result.accessToken });
  res.cookies.set("cordial_refresh", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
