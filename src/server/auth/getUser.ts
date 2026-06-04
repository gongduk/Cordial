import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyAccessToken } from "./tokens";

export async function getUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const payload = verifyAccessToken(auth.slice(7));
    if (payload) return payload.sub;
  }

  // fallback: NextAuth JWT cookie (OAuth / credentials session)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return (token.id ?? token.sub) as string;

  return null;
}
