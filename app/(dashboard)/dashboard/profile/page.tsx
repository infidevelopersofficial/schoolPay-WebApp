import { auth } from "@/lib/auth"
import { prisma as db } from "@/lib/prisma"
import { getTenantContext } from "@/lib/tenant-context"
import { ProfileFormClient } from "@/components/profile/profile-form-client"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Mail, Building2 } from "lucide-react"

export default async function ProfilePage() {
  const session = await auth()
  const sessionUser = session?.user as any
  const userId = sessionUser?.id
  const isImpersonating = sessionUser?.isImpersonating === true

  const { schoolId } = await getTenantContext()

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { name: true, address: true, phone: true },
  })

  // SCHOOLPAY_TEAM impersonators don't exist in the User table.
  // Show a read-only impersonation profile card instead.
  if (isImpersonating) {
    const initials = (sessionUser?.name || sessionUser?.email || "R")
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

    return (
      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20">
                <AvatarImage src={sessionUser?.image || undefined} />
                <AvatarFallback className="text-lg bg-amber-100 text-amber-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{sessionUser?.name || "SchoolPay Team"}</h1>
                  <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50 gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Impersonating
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {sessionUser?.email || "—"}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Viewing: <span className="font-medium text-foreground">{school?.name || "School"}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">You are currently impersonating this school.</p>
              <p className="text-amber-700">
                Profile editing is disabled during impersonation. Exit impersonation to manage your own profile.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Regular user flow
  const user = await db.user.findUnique({
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
  })

  if (!user) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        Unable to load profile. Please try logging in again.
      </div>
    )
  }

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
