import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

const fallbackRedis = redis || {
  sadd: async () => 0,
  eval: async () => [0, 0],
} as any;

/**
 * Mobile API Rate Limiting
 * 100 requests per minute per user
 */
export const mobileApiRateLimit = new Ratelimit({
  redis: fallbackRedis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  prefix: "ratelimit:mobile_api",
  analytics: true,
});
