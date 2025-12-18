"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Users,
  GraduationCap,
  UserCircle,
  BookOpen,
  School,
  Settings,
  LogOut,
  CreditCard,
  DollarSign,
  BarChart3,
  FileText,
  Calendar,
  ClipboardCheck,
  MessageSquare,
  Megaphone,
  Award,
  BookMarked,
} from "lucide-react"

const menuItems = [
  { label: "MENU", items: [] },
  { icon: Home, label: "Home", href: "/" },
  { icon: GraduationCap, label: "Teachers", href: "/teachers" },
  { icon: Users, label: "Students", href: "/students" },
  { icon: UserCircle, label: "Parents", href: "/parents" },
  { icon: BookOpen, label: "Subjects", href: "/subjects" },
  { icon: School, label: "Classes", href: "/classes" },
  { icon: BookMarked, label: "Lessons", href: "/lessons" },
  { icon: FileText, label: "Exams", href: "/exams" },
  { icon: Award, label: "Results", href: "/results" },
  { icon: ClipboardCheck, label: "Attendance", href: "/attendance" },
  { icon: Calendar, label: "Events", href: "/events" },
  { icon: MessageSquare, label: "Messages", href: "/messages" },
  { icon: Megaphone, label: "Announcements", href: "/announcements" },
  { label: "FINANCE", items: [] },
  { icon: DollarSign, label: "Fees", href: "/fees" },
  { icon: CreditCard, label: "Payments", href: "/payments" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { label: "OTHER", items: [] },
  { icon: UserCircle, label: "Profile", href: "/profile" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: LogOut, label: "Logout", href: "/logout" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 bg-card border-r border-border hidden md:flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
          <School className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-foreground">SchoolPay</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item, index) => {
            if (!item.icon) {
              return (
                <li key={index} className="pt-4 pb-2">
                  <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </span>
                </li>
              )
            }

            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={index}>
                <Link
                  href={item.href || "#"}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
