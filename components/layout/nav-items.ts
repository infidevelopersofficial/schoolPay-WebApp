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

export interface NavSection {
  section: true
  label: string
}

export interface NavItem {
  section?: false
  icon: LucideIcon
  label: string
  href: string
}

export type NavEntry = NavSection | NavItem

export const navItems: NavEntry[] = [
  { section: true, label: "MENU" },
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
  { section: true, label: "FINANCE" },
  { icon: DollarSign, label: "Fees", href: "/fees" },
  { icon: CreditCard, label: "Payments", href: "/payments" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { section: true, label: "OTHER" },
  { icon: UserCircle, label: "Profile", href: "/profile" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: LogOut, label: "Logout", href: "/logout" },
]
