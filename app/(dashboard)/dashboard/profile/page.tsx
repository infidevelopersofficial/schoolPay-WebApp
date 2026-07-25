import { auth } from "@/lib/auth"
import { prisma as db } from "@/lib/prisma"
import { getTenantContext } from "@/lib/tenant-context"
import { ProfileFormClient } from "@/components/profile/profile-form-client"

export default async function ProfilePage() {
  const session = await auth()
  const userId = (session?.user as any)?.id
  const { schoolId } = await getTenantContext()

  const [user, school] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        image: true,
        role: true,
        createdAt: true,
      },
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { name: true, address: true, phone: true },
    }),
  ])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        Unable to load profile. Please try logging in again.
      </div>
    )
  }

  // Serialize dates for client component
  const serializedUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
  }

  return (
    <ProfileFormClient
      user={serializedUser}
      schoolName={school?.name || "School"}
      schoolAddress={school?.address || null}
      schoolPhone={school?.phone || null}
    />
  )
}
