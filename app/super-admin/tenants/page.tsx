import { prisma } from "@/lib/prisma"
import { TenantsTable } from "./tenants-table"

export default async function TenantsPage() {
  const schools = await prisma.school.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      plan: true,
      users: {
        where: { role: "ADMIN" },
        select: { user: { select: { email: true } } },
        take: 1
      }
    }
  })

  // Format data for the table
  const formattedSchools = schools.map(s => ({
    id: s.id,
    schoolCode: s.schoolCode,
    name: s.name,
    type: s.tenantType,
    plan: s.plan?.name || "Free",
    status: s.isActive ? "Active" : "Inactive",
    isDemo: s.isDemo,
    demoExpiresAt: s.demoExpiresAt ? s.demoExpiresAt.toISOString() : null,
    adminEmail: s.users[0]?.user.email || "No Admin"
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground mt-1">Manage all registered schools and coaching centers.</p>
        </div>
      </div>
      
      <TenantsTable data={formattedSchools} />
    </div>
  )
}
