import { getTeacherDetail } from "@/lib/dal/teachers"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default async function TeacherDetailPage({ params }: { params: { id: string } }) {
  const teacher = await getTeacherDetail(params.id)

  if (!teacher) {
    notFound()
  }

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Teacher Profile</h1>
        <Badge variant={teacher.isActive ? "default" : "secondary"}>
          {teacher.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Personal Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{teacher.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{teacher.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{teacher.phone || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Specialization</p>
              <p className="font-medium">{teacher.specialization || "—"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Academics & Schedule */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                {teacher.subjects.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {teacher.subjects.map((ts) => (
                      <li key={ts.id}>{ts.subject.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No subjects assigned.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Class Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {teacher.classAssignments.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {teacher.classAssignments.map((ca) => (
                      <li key={ca.id}>{ca.class.name} - {ca.class.section}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No classes assigned.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.lessons.length > 0 ? (
                <div className="space-y-4">
                  {teacher.lessons.map((lesson) => (
                    <div key={lesson.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">{lesson.class} • {lesson.subject}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{format(new Date(lesson.date), "MMM d, yyyy")}</p>
                        <p className="text-xs text-muted-foreground">{lesson.time || "—"} ({lesson.duration})</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming lessons scheduled.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
