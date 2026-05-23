import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ActivationForm } from "./activation-form"
import { prisma } from "@/lib/prisma"

export default async function StudentActivatePage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/school/login")
  }

  // Double check they are pending activation
  if (!(session as any).isPendingActivation) {
    redirect("/student/dashboard")
  }

  const student = await prisma.student.findUnique({
    where: { id: session.user.studentId }
  })

  return (
    <div className="flex flex-col justify-center min-h-screen p-4 bg-slate-950 sm:p-8">
      <div className="w-full max-w-md mx-auto space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Activate Your Account</h1>
          <p className="text-slate-400 text-sm">
            Welcome, {student?.name}! Please verify your details to set up your portal access.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <ActivationForm hasDob={!!student?.dateOfBirth} />
        </div>
      </div>
    </div>
  )
}
