import { getSubject } from "@/lib/dal/subjects"
import { notFound } from "next/navigation"
import { EditSubjectForm } from "@/components/subjects/edit-subject-form"

export default async function EditSubjectPage({ params }: { params: { id: string } }) {
  const subject = await getSubject(params.id)

  if (!subject) {
    notFound()
  }

  // Find the primary teacher from the relation (if any)
  const primaryTeacherId = subject.teacherSubjects && subject.teacherSubjects.length > 0 
    ? subject.teacherSubjects[0].teacherId 
    : ""

  // Only pass the currently linked teacher to populate defaultOptions
  let teachers: any[] = []
  if (primaryTeacherId) {
    const { getTeacher } = await import("@/lib/dal/teachers")
    const teacher = await getTeacher(primaryTeacherId)
    if (teacher) teachers = [teacher]
  }

  const initialData = {
    id: subject.id,
    name: subject.name,
    code: subject.code,
    description: subject.description || "",
    teacherId: primaryTeacherId,
  }

  return (
    <EditSubjectForm 
      initialData={initialData} 
      defaultTeachers={teachers}
    />
  )
}
