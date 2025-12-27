/**
 * MIDDLEWARE: Edge-Safe Authentication
 * 
 * ARCHITECTURAL RULES:
 * 1. Middleware runs on EDGE RUNTIME (Cloudflare Workers)
 * 2. Cannot import modules that use Node.js APIs (like Prisma)
 * 3. Can only verify JWT tokens (stateless)
 * 4. Database access must happen in API routes (Node.js runtime)
 * 5. Matcher MUST exclude /api/auth (keeps auth in Node.js runtime)
 */

import { auth } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnLoginPage = req.nextUrl.pathname.startsWith('/login')
  const isOnApiRoute = req.nextUrl.pathname.startsWith('/api')

  // Allow all API routes (they handle their own authentication)
  if (isOnApiRoute) {
    return NextResponse.next()
  }

  // Unauthenticated user trying to access protected page
  if (!isLoggedIn && !isOnLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Authenticated user trying to access login page
  if (isLoggedIn && isOnLoginPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Exclude: _next/static, _next/image, favicon, api/auth (CRITICAL)
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}