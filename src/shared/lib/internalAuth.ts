import { NextRequest, NextResponse } from "next/server";

export function checkInternalSecret(req: NextRequest): NextResponse | null {
  const secret = process.env.NEXT_PUBLIC_INTERNAL_API_SECRET;
  if (!secret) return null;
  if (req.headers.get("x-internal-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
