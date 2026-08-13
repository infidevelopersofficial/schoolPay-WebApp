import { getClasses } from "@/lib/dal/classes"
import { getAcademicSessions } from "@/lib/dal/core"
import { PromoteStudentsForm } from "@/components/students/promote-students-form"

export default async function PromoteStudentsPage() {
  const [classes, sessions] = await Promise.all([
    getClasses(),
    getAcademicSessions()
  ])

  // Extract unique classes/sections for the UI dropdowns
  const uniqueClasses = Array.from(new Set(classes.map(c => c.name))).sort()
  const classSectionsMap = new Map<string, string[]>()
  classes.forEach(c => {
    if (!classSectionsMap.has(c.name)) {
      classSectionsMap.set(c.name, [])
    }
    if (c.section && !classSectionsMap.get(c.name)!.includes(c.section)) {
      classSectionsMap.get(c.name)!.push(c.section)
    }
  })

  // Convert map to plain object for client component props
  const classOptions: Record<string, string[]> = {}
  classSectionsMap.forEach((sections, cls) => {
    classOptions[cls] = sections.sort()
  })

  const currentSession = sessions.find(s => s.isCurrent)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Promote Students</h1>
        <p className="text-muted-foreground mt-1">
          Bulk promote students to the next academic session or class.
        </p>
      </div>

      <PromoteStudentsForm 
        classes={uniqueClasses}
        classSections={classOptions}
        sessions={sessions}
        defaultTargetSessionId={currentSession?.id}
      />
    </div>
  )
}
