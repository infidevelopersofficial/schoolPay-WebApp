import { redirect } from "next/navigation"

// /parent → /parent/dashboard
export default function ParentPortalRoot() {
  redirect("/parent/dashboard")
}
