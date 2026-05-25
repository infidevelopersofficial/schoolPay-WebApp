import { getExamGroups, getExams } from "@/lib/dal/exams"
import { getBatches } from "@/lib/dal/batches"
import { getSubjects } from "@/lib/dal/subjects"
import { getActiveSession } from "@/lib/dal/core"
import ExamDashboard from "@/components/exams/ExamDashboard"
import { getGradingSchemes } from "@/lib/dal/grading"

export const metadata = {
  title: "Exams & Gradebook",
}

export default async function ExamsPage() {
  const session = await getActiveSession()
  const examGroups = session ? await getExamGroups(session.id) : []
  const exams = await getExams()
  const batches = await getBatches()
  const subjects = await getSubjects()
  const gradingSchemes = await getGradingSchemes()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exams & Gradebook</h1>
        <p className="text-sm text-muted-foreground">Manage exam groups, schedules, and student marks</p>
      </div>

      <ExamDashboard
        initialExamGroups={examGroups}
        initialExams={exams}
        batches={batches}
        subjects={subjects}
        gradingSchemes={gradingSchemes}
        activeSessionId={session?.id || ""}
      />
    </div>
  )
}
