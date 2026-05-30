import { getExamById } from "@/lib/dal/exams"
import { getResults } from "@/lib/dal/results"
import { getEnrollments } from "@/lib/dal/enrollments"
import { getActiveSession } from "@/lib/dal/core"
import { redirect } from "next/navigation"
import GradebookGrid from "@/components/exams/GradebookGrid"

export default async function GradebookPage({ params }: { params: { id: string } }) {
  const session = await getActiveSession()
  if (!session) redirect("/dashboard")

  const exam = await getExamById(params.id)
  if (!exam) redirect("/exams")

  // Fetch all students in the batch
  const enrollments = await getEnrollments({ batchId: exam.batchId })
  const students = enrollments.map(e => e.student)
  
  // Fetch existing results for this exam
  const results = await getResults({ examId: exam.id, sessionId: session.id })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{exam.name} - Gradebook</h1>
        <p className="text-sm text-muted-foreground">
          Batch: {exam.batch.name} | Subject: {exam.subject.name} | Max Marks: {exam.maxMarks}
        </p>
      </div>

      <GradebookGrid 
        exam={exam} 
        students={students} 
        initialResults={results}
        activeSessionId={session.id}
      />
    </div>
  )
}
