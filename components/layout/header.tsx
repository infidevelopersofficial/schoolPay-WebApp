"use client"

import { Bell, MessageCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MobileNav } from "./mobile-nav"
import { ThemeToggle } from "./theme-toggle"
import { NotificationBell } from "./notification-bell"
import { useSession } from "next-auth/react"
import { AlertTriangle } from "lucide-react"


interface HeaderProps {
  userName?: string | null
  userEmail?: string | null
  userImage?: string | null
}

function initials(name: string | null | undefined): string {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function Header({ userName, userEmail, userImage }: HeaderProps) {
  const { data: session, update } = useSession()
  const isImpersonating = session?.user?.isImpersonating === true

  const displayName = userName ?? "User"
  const displayRole = userEmail ?? ""

  return (
    <>
      {isImpersonating && (
        <div className="w-full bg-amber-500 text-white px-4 py-2 flex items-center justify-center text-sm font-medium sticky top-0 z-40">
          <AlertTriangle className="w-4 h-4 mr-2" />
          You are viewing this school as admin
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-4 h-7 bg-white/20 hover:bg-white/30 text-white"
            onClick={async () => {
              await update({ exitImpersonation: true })
              window.location.href = "/super-admin/tenants"
            }}
          >
            Exit impersonation
          </Button>
        </div>
      )}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6 gap-3">
      {/* Mobile nav trigger */}
      <MobileNav />

      {/* Search */}
      <div className="relative flex-1 max-w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 text-sm"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Messages"
        >
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
        </Button>
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
    </>
  )
}
