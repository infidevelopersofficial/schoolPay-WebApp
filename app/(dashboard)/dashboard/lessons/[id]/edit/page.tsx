import { getLesson } from "@/lib/dal/lessons"
import { getClasses } from "@/lib/dal/classes"
import { getSubjects } from "@/lib/dal/subjects"
import { getTeachers } from "@/lib/dal/teachers"
import { notFound } from "next/navigation"
import { CreateLessonForm } from "@/components/forms/create-lesson-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EditLessonPage({ params }: { params: { id: string } }) {
  const [lesson, classes, subjects, teachers] = await Promise.all([
    getLesson(params.id),
    getClasses(),
    getSubjects(),
    getTeachers()
  ])

  if (!lesson) {
    notFound()
  }

  const initialData = {
    id: lesson.id,
    title: lesson.title,
    subject: lesson.subject,
    class: lesson.class,
    teacherId: lesson.teacherId || "",
    date: lesson.date,
    time: lesson.time || "",
    duration: lesson.duration,
    description: lesson.description || "",
    status: lesson.status,
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Lesson: {lesson.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateLessonForm 
            mode="edit" 
            initialData={initialData}
            classes={classes}
            subjects={subjects}
            teachers={teachers}
            open={true} 
            onOpenChange={() => {}} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
