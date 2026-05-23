import { prisma } from "@/lib/prisma"
import { getSchoolId } from "@/lib/tenant-context"
import { notFound } from "next/navigation"
import { PortalAccessCard } from "./portal-access"

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const schoolId = await getSchoolId()
  if (!schoolId) notFound()

  const student = await prisma.student.findUnique({
    where: { id: params.id, schoolId },
    include: { user: true }
  })

  if (!student) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
      <p className="text-muted-foreground">Admission No: {student.admissionNumber}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <PortalAccessCard student={student} />
      </div>
    </div>
  )
}
