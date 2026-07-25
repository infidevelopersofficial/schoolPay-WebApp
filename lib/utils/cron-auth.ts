import { NextResponse } from "next/server"
import crypto from "crypto"

/**
 * Validates CRON_SECRET authentication for cron and background job endpoints.
 * 
 * Guarantees:
 * - Fails CLOSED: If CRON_SECRET is not set or empty in environment variables, returns 401 Unauthorized.
 * - Constant-time comparison: Uses crypto.timingSafeEqual to prevent timing side-channel attacks.
 * - Supports Bearer authorization header or 'secret' query parameter.
 * 
 * Returns null if authorized, or a NextResponse (401) if unauthorized.
 */
export function verifyCronAuth(req: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || typeof cronSecret !== "string" || cronSecret.trim().length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn("CRON_SECRET is not set in environment variables. Failing closed.")
    }
    return NextResponse.json({ error: "Unauthorized: Server CRON_SECRET not configured" }, { status: 401 })
  }

  const authHeader = req.headers.get("authorization")
  let token: string | null = null

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim()
  } else {
    try {
      const url = new URL(req.url)
      token = url.searchParams.get("secret")
    } catch {
      // ignore malformed URL
    }
  }

  if (!token || typeof token !== "string" || token.length !== cronSecret.length) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const tokenBuffer = Buffer.from(token, "utf8")
    const secretBuffer = Buffer.from(cronSecret, "utf8")

    if (!crypto.timingSafeEqual(tokenBuffer, secretBuffer)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return null // Authorized
}
