import { NextRequest, NextResponse } from "next/server";
import { deleteRefreshToken } from "@/server/auth/tokens";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("cordial_refresh")?.value;
  if (token) await deleteRefreshToken(token);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("cordial_refresh", "", { httpOnly: true, maxAge: 0, path: "/" });
  return res;
}
