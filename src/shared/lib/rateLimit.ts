import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const EXEMPT_EMAILS = (process.env.RATE_LIMIT_EXEMPT_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 환경변수가 설정되지 않았습니다.");
    redis = new Redis({ url, token });
  }
  return redis;
}

const LIMITS = {
  "analyze-emotion": { requests: 20, window: "1 d" },
  recommend: { requests: 20, window: "1 d" },
  "pantry-recommend": { requests: 10, window: "1 d" },
  "mix-analyze": { requests: 10, window: "1 d" },
} as const;

type Endpoint = keyof typeof LIMITS;

const limiterCache = new Map<Endpoint, Ratelimit>();

function getLimiter(endpoint: Endpoint): Ratelimit {
  if (!limiterCache.has(endpoint)) {
    const { requests, window } = LIMITS[endpoint];
    limiterCache.set(
      endpoint,
      new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(requests, window),
        prefix: `rl:${endpoint}`,
      })
    );
  }
  return limiterCache.get(endpoint)!;
}

export async function checkRateLimit(
  req: NextRequest,
  endpoint: Endpoint,
  email?: string | null
): Promise<NextResponse | null> {
  if (email && EXEMPT_EMAILS.includes(email)) return null;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const identifier = email ?? ip;

  const { success, limit, remaining, reset } = await getLimiter(endpoint).limit(identifier);

  if (!success) {
    return NextResponse.json(
      { error: "일일 요청 한도를 초과했습니다. 내일 다시 시도해 주세요." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
  }

  return null;
}
