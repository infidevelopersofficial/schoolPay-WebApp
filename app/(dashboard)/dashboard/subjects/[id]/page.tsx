import { getSubjectDetail } from "@/lib/dal/subjects"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { parseISO, format } from "date-fns"

export default async function SubjectDetailPage({ params }: { params: { id: string } }) {
  const subject = await getSubjectDetail(params.id)

  if (!subject) {
    notFound()
  }

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold tracking-tight">{subject.name}</h1>
        <p className="text-muted-foreground mt-1">Code: {subject.code}</p>
        {subject.description && (
          <p className="text-sm mt-2 max-w-2xl">{subject.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assigned Teachers Card */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            {subject.teacherSubjects.length > 0 ? (
              <ul className="list-disc list-inside space-y-2">
                {subject.teacherSubjects.map((ts) => (
                  <li key={ts.id} className="font-medium">
                    {ts.teacher.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No teachers currently assigned to teach this subject.</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Lessons Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            {subject.lessons.length > 0 ? (
              <div className="space-y-4">
                {subject.lessons.map((lesson) => (
                  <div key={lesson.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{lesson.title}</p>
                      <p className="text-xs text-muted-foreground">Class: {lesson.class}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{format(parseISO(lesson.date), "MMM d, yyyy")}</p>
                      <p className="text-xs text-muted-foreground">{lesson.time || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming lessons scheduled for this subject.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
