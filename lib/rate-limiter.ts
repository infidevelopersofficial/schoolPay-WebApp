import { LRUCache } from "lru-cache"

/**
 * Basic in-memory rate limiter using LRU Cache.
 * Stores number of failed login attempts per IP/Email.
 */
const rateLimitCache = new LRUCache({
  max: 500,
  ttl: 15 * 60 * 1000, // 15 minutes
})

export async function checkRateLimit(identifier: string, maxAttempts = 5) {
  const currentAttempts = (rateLimitCache.get(identifier) as number) || 0

  if (currentAttempts >= maxAttempts) {
    return { success: false, remaining: 0, resetIn: "15 minutes" }
  }

  rateLimitCache.set(identifier, currentAttempts + 1)
  return { success: true, remaining: maxAttempts - currentAttempts - 1 }
}

export function resetRateLimit(identifier: string) {
  rateLimitCache.delete(identifier)
}
