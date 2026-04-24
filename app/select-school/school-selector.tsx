"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Building2, MapPin, Loader2 } from "lucide-react"

interface School {
  id: string
  name: string
  slug: string
  logo: string | null
  address: string | null
  role: string
}

interface SchoolSelectorProps {
  schools: School[]
  userName: string
}

export function SchoolSelector({ schools, userName }: SchoolSelectorProps) {
  const { update } = useSession()
  const router = useRouter()
  const [selecting, setSelecting] = useState<string | null>(null)

  async function handleSelect(schoolId: string) {
    setSelecting(schoolId)
    try {
      // Update the JWT session with the selected school
      await update({ activeSchoolId: schoolId })
      router.push("/")
      router.refresh()
    } catch {
      setSelecting(null)
    }
  }

  if (schools.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          No Schools Found
        </h2>
        <p className="mt-2 text-muted-foreground">
          You haven&apos;t been assigned to any school yet. Please contact your
          administrator.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Welcome back, <span className="font-medium text-foreground">{userName}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {schools.map((school) => (
          <button
            key={school.id}
            onClick={() => handleSelect(school.id)}
            disabled={selecting !== null}
            className="group relative flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {/* School logo or fallback */}
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              {school.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={school.logo}
                  alt={school.name}
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                <Building2 className="h-6 w-6" />
              )}
            </div>

            {/* School info */}
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {school.name}
              </h3>
              {school.address && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {school.address}
                </p>
              )}
            </div>

            {/* Role badge */}
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {school.role.replace("_", " ")}
            </span>

            {/* Loading state */}
            {selecting === school.id && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
