import type React from "react"
import { StudentSidebar } from "@/components/layout/student-sidebar"
import { StudentHeader } from "@/components/layout/student-header"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Double check role enforcement at the layout level
  if (session.user.schoolRole !== "STUDENT") {
    redirect("/")
  }

  const user = session.user

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <div className="pl-0 md:pl-56">
        <StudentHeader
          userName={user.name}
          userEmail={user.email}
          userImage={user.image}
        />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
