import { getTeacherWithAssignments } from "@/lib/dal/teachers"
import { getClasses } from "@/lib/dal/classes"
import { getSubjects } from "@/lib/dal/subjects"
import { notFound } from "next/navigation"
import { AddTeacherForm } from "@/components/forms/add-teacher-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EditTeacherPage({ params }: { params: { id: string } }) {
  const teacher = await getTeacherWithAssignments(params.id)

  if (!teacher) {
    notFound()
  }

  const [classes, subjects] = await Promise.all([
    getClasses(),
    getSubjects()
  ])

  // Map database model to form expected fields
  const initialData = {
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    phone: teacher.phone,
    gender: teacher.gender || "",
    dateOfBirth: teacher.dateOfBirth?.toISOString(),
    qualification: teacher.qualification || "",
    experience: teacher.experience || "",
    joiningDate: teacher.joiningDate?.toISOString(),
    salary: teacher.salary?.toString() || "",
    address: teacher.address || "",
    subjectIds: teacher.subjects.map(ts => ts.subjectId),
    classAssignments: teacher.classAssignments.map(ca => ({
      classId: ca.classId,
      isClassTeacher: ca.isClassTeacher
    }))
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Teacher: {teacher.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <AddTeacherForm 
            mode="edit" 
            initialData={initialData} 
            open={true} 
            onOpenChange={() => {}} 
            classes={classes}
            subjects={subjects}
          />
        </CardContent>
      </Card>
    </div>
  )
}
