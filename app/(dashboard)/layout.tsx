import type React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { auth } from "@/lib/auth"

/**
 * Dashboard Layout — wraps all authenticated pages with the sidebar and header.
 *
 * This is a Server Component layout. The Sidebar and Header are client components
 * (they use hooks), but they're rendered inside this server layout which means
 * the shell is streamed instantly and the interactive parts hydrate independently.
 *
 * Because this is a Next.js layout, it persists across navigations within the
 * (dashboard) route group — the sidebar doesn't re-mount on every page change.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  const user = session?.user

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-0 md:pl-56">
        <Header
          userName={user?.name}
          userEmail={user?.email}
          userImage={user?.image}
        />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
