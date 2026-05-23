import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "./redis"

// Ensure we have a dummy Redis interface if credentials are missing locally
// so that Ratelimit doesn't crash on initialization
const fallbackRedis = redis || {
  sadd: async () => 0,
  eval: async () => [0, 0],
} as any;

/**
 * 1. Global Platform Protection
 * 100 requests per 10 seconds per IP
 */
export const globalRateLimit = new Ratelimit({
  redis: fallbackRedis,
  limiter: Ratelimit.slidingWindow(100, "10 s"),
  prefix: "ratelimit:global",
  analytics: true,
})

/**
 * 2. Authentication Paths (/login, /school/login, /api/auth/*, /student/activate)
 * Strict limit: 5 requests per minute per IP
 */
export const authRateLimit = new Ratelimit({
  redis: fallbackRedis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "ratelimit:auth",
  analytics: true,
})

/**
 * 3. Distributed Brute Force Limit
 * Uses a composite key: auth:{schoolCode}:{admissionNumber}
 * 5 requests per minute per account target regardless of IP
 */
export const accountBruteForceLimit = new Ratelimit({
  redis: fallbackRedis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "ratelimit:account",
  analytics: true,
})

/**
 * 4. Activation DOB Verification Lock
 * Tracks failed DOB verification attempts per student ID.
 * If they fail 5 times, lock out for 15 minutes.
 */
export const activationLockLimit = new Ratelimit({
  redis: fallbackRedis,
  // 5 requests per 15 minutes window
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "ratelimit:activation",
  analytics: true,
})
