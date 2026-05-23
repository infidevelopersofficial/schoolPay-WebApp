import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis;

if (!url || !token) {
  console.warn("⚠️ Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in environment variables");
  redis = new Redis({
    url: url || "https://dummy.upstash.io",
    token: token || "dummy_token",
  });
} else {
  redis = new Redis({
    url: url,
    token: token,
  });
}

export { redis };
