"use client"

import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { StudentMobileNav } from "./student-mobile-nav"
import { ThemeToggle } from "./theme-toggle"
import { NotificationBell } from "./notification-bell"


interface StudentHeaderProps {
  userName?: string | null
  userEmail?: string | null
  userImage?: string | null
}

function initials(name: string | null | undefined): string {
  if (!name) return "S"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function StudentHeader({ userName, userEmail, userImage }: StudentHeaderProps) {
  const displayName = userName ?? "Student"
  const displayRole = userEmail ?? "Student Account"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6 gap-3">
      {/* Mobile nav trigger */}
      <StudentMobileNav />

      {/* Search */}
      <div className="relative flex-1 max-w-72 hidden sm:flex">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search portal..."
          className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 text-sm"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        <NotificationBell />

        <ThemeToggle />

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground leading-none">{displayName}</p>
            {displayRole && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-36">{displayRole}</p>
            )}
          </div>
          <Avatar className="h-9 w-9">
            <AvatarImage src={userImage ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials(userName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
