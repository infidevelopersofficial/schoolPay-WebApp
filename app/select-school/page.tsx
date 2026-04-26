import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SchoolSelector } from "./school-selector"

export const metadata: Metadata = {
  title: "Select School — SchoolPay",
  description: "Choose the school you want to manage.",
}

export default async function SelectSchoolPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  // If user already has an active school, redirect to dashboard
  if (session.user.activeSchoolId) redirect("/")

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"

  // SUPER_ADMINs see every active school; everyone else sees only their memberships.
  const schools = isSuperAdmin
    ? (
        await prisma.school.findMany({
          where: { isActive: true },
          select: { id: true, name: true, slug: true, logo: true, address: true },
          orderBy: { name: "asc" },
        })
      ).map((s) => ({ ...s, role: "SUPER_ADMIN" as const }))
    : (
        await prisma.userSchool.findMany({
          where: { userId: session.user.id },
          include: {
            school: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                address: true,
                isActive: true,
              },
            },
          },
        })
      )
        .filter((m) => m.school.isActive)
        .map((m) => ({
          id: m.school.id,
          name: m.school.name,
          slug: m.school.slug,
          logo: m.school.logo,
          address: m.school.address,
          role: m.role,
        }))

  // If user only has one school, auto-select it (shouldn't normally reach here
  // since auth.ts handles this, but acts as a safety net)
  if (schools.length === 1) {
    // The client component will handle the session update
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Select School
          </h1>
          <p className="text-muted-foreground">
            Choose the school you want to manage. You can switch schools later from the dashboard.
          </p>
        </div>

        <SchoolSelector
          schools={schools}
          userName={session.user.name ?? "User"}
        />
      </div>
    </div>
  )
}
