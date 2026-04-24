/**
 * Parent Portal Layout
 *
 * Wraps all /parent/* routes with a distinct, parent-focused shell.
 * The admin sidebar is NOT shown here — parents get their own clean nav.
 */
import type React from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ParentPortalNav } from "@/components/parent-portal/nav"

export const metadata = {
  title: "Parent Portal — SchoolPay",
  description: "View your children's academic progress, fees, and school updates",
}

export default async function ParentPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth()
  const user = session?.user as any

  // Hard server-side guard — middleware handles it too, but double-check
  if (!session || user?.schoolRole !== "PARENT") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ParentPortalNav
        userName={user?.name}
        userEmail={user?.email}
        userImage={user?.image}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
