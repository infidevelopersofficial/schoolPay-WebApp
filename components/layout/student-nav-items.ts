import { 
  LayoutDashboard, 
  CalendarCheck, 
  FileText, 
  CreditCard, 
  Receipt, 
  Bell, 
  UserCircle 
} from "lucide-react"

export const studentNavItems = [
  {
    label: "Dashboard",
    href: "/student/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Academics",
    section: true,
  },
  {
    label: "Attendance",
    href: "/student/attendance",
    icon: CalendarCheck,
  },
  {
    label: "Results",
    href: "/student/results",
    icon: FileText,
  },
  {
    label: "Finance",
    section: true,
  },
  {
    label: "Fees",
    href: "/student/fees",
    icon: CreditCard,
  },
  {
    label: "Payments",
    href: "/student/payments",
    icon: Receipt,
  },
  {
    label: "Communication",
    section: true,
  },
  {
    label: "Announcements",
    href: "/student/announcements",
    icon: Bell,
  },
  {
    label: "Account",
    section: true,
  },
  {
    label: "Profile",
    href: "/student/profile",
    icon: UserCircle,
  },
]
