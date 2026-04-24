import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { resolveTenantConfig, TenantType } from "@/lib/tenant-config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  if (!isLoggedIn) return

  // Extract tenantType from the JWT session
  const user = req.auth?.user as any
  const tenantType = (user?.tenantType as TenantType) || "SCHOOL"
  
  // Resolve the configuration matrix for this tenant
  const config = resolveTenantConfig(tenantType)

  const path = nextUrl.pathname

  // ── Route Guards based on Tenant Config ──
  
  // Block access to Classes if tenant has neither Classes nor Batches
  if (path.startsWith("/classes") && !config.hasClasses && !config.hasBatches) {
    return Response.redirect(new URL("/?error=feature-disabled", nextUrl))
  }

  // Block access to Attendance if tenant does not use it
  if (path.startsWith("/attendance") && !config.hasAttendance) {
    return Response.redirect(new URL("/?error=feature-disabled", nextUrl))
  }

  // Block access to Exams and Results if tenant does not use them
  if ((path.startsWith("/exams") || path.startsWith("/results")) && !config.hasExams) {
    return Response.redirect(new URL("/?error=feature-disabled", nextUrl))
  }
})

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|select-school).*)'],
}
