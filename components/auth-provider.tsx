"use client"

import { SessionProvider } from "next-auth/react"
import type React from "react"

/**
 * Auth Session Provider — wraps the app tree with NextAuth's SessionProvider
 * so client components can use `useSession()` for school switching, etc.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
