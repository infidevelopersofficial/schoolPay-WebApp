import { prisma as db } from "@/lib/prisma"
import { getTenantContext } from "@/lib/tenant-context"
import { SettingsFormClient } from "@/components/settings/settings-form-client"

export default async function SettingsPage() {
  const { schoolId } = await getTenantContext()

  const [school, activeSession] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      select: {
        name: true,
        address: true,
        phone: true,
        email: true,
        currency: true,
        timezone: true,
        gstin: true,
        state: true,
      },
    }),
    db.academicSession.findFirst({
      where: { schoolId, isCurrent: true },
      select: { name: true },
    }),
  ])

  if (!school) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        Unable to load school settings. Please contact support.
      </div>
    )
  }

  return (
    <SettingsFormClient
      school={school}
      activeSession={activeSession?.name || null}
    />
  )
}
