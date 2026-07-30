import { getSubject } from "@/lib/dal/subjects"
import { getTeachers } from "@/lib/dal/teachers"
import { notFound } from "next/navigation"
import { AddSubjectForm } from "@/components/forms/add-subject-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EditSubjectPage({ params }: { params: { id: string } }) {
  const subject = await getSubject(params.id)

  if (!subject) {
    notFound()
  }

  // Fetch teachers for the dropdown
  const { teachers } = await getTeachers({ limit: 500 })

  // Find the primary teacher from the relation (if any)
  const primaryTeacherId = subject.teacherSubjects && subject.teacherSubjects.length > 0 
    ? subject.teacherSubjects[0].teacherId 
    : ""

  const initialData = {
    id: subject.id,
    name: subject.name,
    code: subject.code,
    description: subject.description || "",
    teacherId: primaryTeacherId,
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Subject: {subject.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <AddSubjectForm 
            mode="edit" 
            initialData={initialData} 
            open={true} 
            onOpenChange={() => {}} 
            teachers={teachers}
          />
        </CardContent>
      </Card>
    </div>
  )
}
