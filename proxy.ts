/**
 * PROXY: Edge-Safe Authentication Guard
 *
 * In Next.js 16, this file replaces the deprecated `middleware.ts` convention.
 * See: https://nextjs.org/docs/messages/middleware-to-proxy
 *
 * ARCHITECTURAL RULES:
 * 1. Runs on the EDGE RUNTIME — no Node.js APIs (no Prisma, no bcrypt)
 * 2. Auth check is stateless — verifies the JWT in the session cookie only
 * 3. The full auth config (with DB adapter + providers) lives in lib/auth.ts
 * 4. This file imports ONLY from lib/auth.config.ts (edge-safe subset)
 *
 * IMPORTANT: `config.matcher` must be a static literal in this file.
 * Next.js (Turbopack) statically analyzes `config` at build time to determine
 * which routes trigger this proxy. A re-exported config from another module
 * breaks static analysis, causing all routes to become publicly accessible.
 */

import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

export default NextAuth(authConfig).auth

export const config = {
  matcher: [
    // Match all routes EXCEPT: static files, images, favicon, auth API, monitoring tunnel
    "/((?!_next/static|_next/image|favicon.ico|api/auth|monitoring).*)",
  ],
}
