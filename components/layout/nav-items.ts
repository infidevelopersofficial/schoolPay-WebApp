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
  type LucideIcon,
} from "lucide-react"

import { type TenantConfig } from "@/lib/tenant-config"

export interface NavSection {
  section: true
  label: string
}

export interface NavItem {
  section?: false
  icon: LucideIcon
  label: string
  href: string
  show?: (config: TenantConfig) => boolean
}

export type NavEntry = NavSection | NavItem

export const navItems: NavEntry[] = [
  { section: true, label: "MENU" },
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: GraduationCap, label: "Teachers", href: "/dashboard/teachers" },
  { icon: Users, label: "Students", href: "/dashboard/students" },
  { icon: UserCircle, label: "Parents", href: "/dashboard/parents" },
  { icon: BookOpen, label: "Subjects", href: "/dashboard/subjects" },
  { icon: School, label: "Classes", href: "/dashboard/classes", show: (c) => c.hasClasses || c.hasBatches },
  { icon: BookMarked, label: "Lessons", href: "/dashboard/lessons" },
  { icon: FileText, label: "Exams", href: "/dashboard/exams", show: (c) => c.hasExams },
  { icon: Award, label: "Results", href: "/dashboard/results", show: (c) => c.hasExams },
  { icon: ClipboardCheck, label: "Attendance", href: "/dashboard/attendance", show: (c) => c.hasAttendance },
  { icon: Calendar, label: "Events", href: "/dashboard/events" },
  { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
  { icon: Megaphone, label: "Announcements", href: "/dashboard/announcements" },
  { section: true, label: "FINANCE" },
  { icon: DollarSign, label: "Fees", href: "/dashboard/fees" },
  { icon: CreditCard, label: "Payments", href: "/dashboard/payments" },
  { icon: BarChart3, label: "Reports", href: "/dashboard/reports" },
  { section: true, label: "OTHER" },
  { icon: UserCircle, label: "Profile", href: "/dashboard/profile" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: LogOut, label: "Logout", href: "/logout" },
]
