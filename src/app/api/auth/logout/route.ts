import { NextRequest, NextResponse } from "next/server";
import { deleteRefreshToken } from "@/server/auth/tokens";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("cordial_refresh")?.value;
  if (token) {
    try {
      await deleteRefreshToken(token);
    } catch (e) {
      console.error("[auth/logout] 토큰 삭제 실패:", e);
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("cordial_refresh", "", { httpOnly: true, maxAge: 0, path: "/" });
  return res;
}
