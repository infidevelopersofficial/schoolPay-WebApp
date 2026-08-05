import { getClassDetail } from "@/lib/dal/classes"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function ClassDetailPage({ params }: { params: { id: string } }) {
  const cls = await getClassDetail(params.id)

  if (!cls) {
    notFound()
  }

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Class: {cls.name} - {cls.section}
          </h1>
          {cls.classTeacher && (
            <p className="text-muted-foreground mt-1">Class Teacher: {cls.classTeacher.name}</p>
          )}
        </div>
        <Badge variant="outline" className="text-lg py-1 px-4">
          Strength: {cls.students.length} / {cls.capacity}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Roster Card */}
        <Card>
          <CardHeader>
            <CardTitle>Student Roster</CardTitle>
          </CardHeader>
          <CardContent>
            {cls.students.length > 0 ? (
              <div className="space-y-4">
                {cls.students.map((student) => (
                  <div key={student.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {student.studentId || "—"}</p>
                    </div>
                    <Badge variant="secondary">Roll: {student.rollNumber || "—"}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No students enrolled in this class.</p>
            )}
          </CardContent>
        </Card>

        {/* Assigned Teachers Card */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            {cls.teacherClassAssignments.length > 0 ? (
              <ul className="list-disc list-inside space-y-2">
                {cls.teacherClassAssignments.map((assignment) => (
                  <li key={assignment.id} className="font-medium">
                    {assignment.teacher.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No teachers explicitly assigned to this class.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
