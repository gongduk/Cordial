import type { NextRequest } from "next/server";

declare module "next-auth/jwt" {
  interface DefaultJWT {
    id?: string;
  }

  export function getToken(params: {
    req: NextRequest | Request;
    secret?: string;
    secureCookie?: boolean;
    cookieName?: string;
    raw?: false;
    decode?: unknown;
    logger?: unknown;
  }): Promise<(JWT & { id?: string; sub?: string }) | null>;
}
