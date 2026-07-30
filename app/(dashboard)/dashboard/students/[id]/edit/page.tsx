import { getStudent } from "@/lib/dal/students"
import { notFound } from "next/navigation"
import { AddStudentForm } from "@/components/forms/add-student-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EditStudentPage({ params }: { params: { id: string } }) {
  const student = await getStudent(params.id)

  if (!student) {
    notFound()
  }

  // Map database model to form expected fields
  const initialData = {
    id: student.id,
    name: student.name,
    parentId: student.parentId,
    parentName: student.parent?.name || "",
    parentEmail: student.parent?.email || "",
    parentMobile: student.parent?.mobile || "", 
    class: student.class?.split('-')[0] || student.class,
    section: student.section || "",
    dateOfBirth: student.dateOfBirth?.toISOString(),
    gender: student.gender || "", 
    rollNumber: student.rollNumber || "", 
    bloodGroup: student.bloodGroup || "", 
    totalFees: student.totalFees?.toString() || "0",
    emergencyContact: student.emergencyContact || "", 
    address: student.address || "", 
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Student: {student.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <AddStudentForm mode="edit" initialData={initialData} open={true} onOpenChange={() => {}} />
        </CardContent>
      </Card>
    </div>
  )
}
