import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;

if (!url || !token) {
  console.warn("⚠️ Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in environment variables. Falling back to in-memory rate limiting.");
} else {
  redis = new Redis({
    url: url,
    token: token,
  });
}

export { redis };
