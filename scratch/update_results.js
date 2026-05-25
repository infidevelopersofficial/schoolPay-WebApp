const fs = require("fs");

const newContent = `import { getParentDashboard, getChildResults } from "@/lib/dal/parent-portal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Trophy, TrendingUp, BookOpen } from "lucide-react"

export const metadata = {
  title: "Results - Parent Portal",
}

function gradeColor(grade: string | null) {
  if (!grade) return "bg-slate-100 text-slate-700 border-slate-200"
  const g = grade.toUpperCase()
  if (["A+", "A"].includes(g)) return "bg-emerald-100 text-emerald-700 border-emerald-200"
  if (["B+", "B"].includes(g)) return "bg-blue-100 text-blue-700 border-blue-200"
  if (["C+", "C"].includes(g)) return "bg-amber-100 text-amber-700 border-amber-200"
  return "bg-red-100 text-red-700 border-red-200"
}

export default async function ParentResultsPage() {
  const data = await getParentDashboard()
  const students = data?.students ?? []

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Exam Results</h1>
        <p className="text-slate-500 mt-1 text-sm">Academic performance tracked by term and exam group</p>
      </div>

      {students.map(async (student) => {
        // Fetch full results with exam group structure for this child
        const fullResults = await getChildResults(student.id).catch(() => []);
        
        const avgPercentage = fullResults.length > 0
          ? fullResults.reduce((s, r) => s + (r.marks !== null && r.exam.maxMarks > 0 ? (r.marks / r.exam.maxMarks) * 100 : 0), 0) / fullResults.length
          : null

        // Group by AcademicYear -> ExamGroup
        const grouped = fullResults.reduce((acc, result) => {
          const yearName = result.exam.examGroup?.academicYear?.name || "Unassigned Year";
          const groupName = result.exam.examGroup?.name || "Ungrouped Exams";
          const termName = result.exam.examGroup?.term || "";
          
          if (!acc[yearName]) acc[yearName] = {};
          if (!acc[yearName][groupName]) acc[yearName][groupName] = { term: termName, results: [] };
          
          acc[yearName][groupName].results.push(result);
          return acc;
        }, {} as Record<string, Record<string, { term: string, results: typeof fullResults }>>);

        return (
          <div key={student.id} className="space-y-6">
            {/* Child header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{student.name}</h2>
                  <p className="text-sm text-slate-500">Roll No: {student.rollNumber || "N/A"}</p>
                </div>
              </div>
              {avgPercentage !== null && (
                <div className="flex items-center gap-2 bg-violet-50 dark:bg-violet-900/20 px-4 py-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                  <div>
                    <p className="text-xs text-violet-600 font-medium">Overall Average</p>
                    <span className="text-lg font-bold text-violet-700 dark:text-violet-300 leading-none">
                      {avgPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {fullResults.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Star className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">No results published yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {Object.entries(grouped).map(([yearName, groups]) => (
                  <div key={yearName} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{yearName}</h3>
                    
                    {Object.entries(groups).map(([groupName, { term, results }]) => (
                      <Card key={groupName} className="overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                              <BookOpen className="w-4 h-4 text-violet-500" />
                              {groupName}
                            </CardTitle>
                            {term && <Badge variant="outline" className="bg-white">{term}</Badge>}
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {results.map((result) => {
                              const perc = result.marks !== null && result.exam.maxMarks > 0 
                                ? (result.marks / result.exam.maxMarks) * 100 
                                : 0
                              return (
                                <div key={result.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                        {result.exam.name}
                                      </p>
                                      <Badge variant="outline" className={\`text-xs \${gradeColor(result.grade)}\`}>
                                        {result.grade || "-"}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500">{result.exam.subject}</p>
                                  </div>
                                  
                                  <div className="w-full sm:w-48 flex-shrink-0">
                                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                                      <span>{result.marks ?? "-"} / {result.exam.maxMarks}</span>
                                      <span className="font-medium text-slate-700 dark:text-slate-300">{perc.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div
                                        className={\`h-full rounded-full transition-all \${
                                          perc >= 75
                                            ? "bg-emerald-500"
                                            : perc >= 50
                                              ? "bg-amber-500"
                                              : "bg-red-500"
                                        }\`}
                                        style={{ width: \`\${Math.min(100, perc)}%\` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
`

fs.writeFileSync("app/(parent-portal)/parent/results/page.tsx", newContent);
