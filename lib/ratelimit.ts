import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "./redis"

const createRateLimiter = (options: any) => {
  if (!redis) {
    return {
      limit: async () => ({ success: true, remaining: 999, reset: 0 }),
    };
  }
  return new Ratelimit({ ...options, redis });
};

/**
 * 1. Global Platform Protection
 * 100 requests per 10 seconds per IP
 */
export const globalRateLimit = createRateLimiter({
  limiter: Ratelimit.slidingWindow(100, "10 s"),
  prefix: "ratelimit:global",
  analytics: true,
}) as Ratelimit;

/**
 * 2. Authentication Paths (/login, /school/login, /api/auth/*, /student/activate)
 * Strict limit: 5 requests per minute per IP
 */
export const authRateLimit = createRateLimiter({
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "ratelimit:auth",
  analytics: true,
}) as Ratelimit;

/**
 * 3. Distributed Brute Force Limit
 * Uses a composite key: auth:{schoolCode}:{admissionNumber}
 * 5 requests per minute per account target regardless of IP
 */
export const accountBruteForceLimit = createRateLimiter({
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "ratelimit:account",
  analytics: true,
}) as Ratelimit;

/**
 * 4. Activation DOB Verification Lock
 * Tracks failed DOB verification attempts per student ID.
 * If they fail 5 times, lock out for 15 minutes.
 */
export const activationLockLimit = createRateLimiter({
  // 5 requests per 15 minutes window
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "ratelimit:activation",
  analytics: true,
}) as Ratelimit;

/**
 * 5. Tenant Onboarding & Slug Protection
 * Strict limit to prevent spam and brute-force slug probing.
 */
export const onboardingRateLimit = createRateLimiter({
  limiter: Ratelimit.slidingWindow(3, "1 m"), // 3 requests per minute per IP
  prefix: "ratelimit:onboarding",
  analytics: true,
}) as Ratelimit;
