"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { GraduationCap, LogOut } from "lucide-react"
import { studentNavItems } from "./student-nav-items"

export function StudentSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 bg-card border-r border-border hidden md:flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-primary to-accent">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-foreground">Student Portal</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <StudentNavList pathname={pathname} />
      </nav>
    </aside>
  )
}

export function StudentNavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {studentNavItems.map((item, index) => {
        if (item.section) {
          return (
            <li key={index} className="pt-4 pb-2">
              <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {item.label}
              </span>
            </li>
          )
        }

        const Icon = item.icon!
        const isActive = pathname === item.href

        return (
          <li key={index}>
            <Link
              href={item.href!}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          </li>
        )
      })}
      <li className="pt-4">
        <button
          type="button"
          onClick={() => {
            onNavigate?.()
            signOut({ callbackUrl: "/school/login" })
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="truncate">Sign Out</span>
        </button>
      </li>
    </ul>
  )
}
