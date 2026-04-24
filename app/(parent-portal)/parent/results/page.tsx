import { getParentDashboard } from "@/lib/dal/parent-portal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Trophy, TrendingUp } from "lucide-react"

export const metadata = {
  title: "Results — Parent Portal",
}

function gradeColor(grade: string) {
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Exam Results</h1>
        <p className="text-slate-500 mt-1 text-sm">Recent academic performance across all subjects</p>
      </div>

      {students.map((student) => {
        const avgPercentage = student.results.length > 0
          ? student.results.reduce((s, r) => s + r.percentage, 0) / student.results.length
          : null

        return (
          <div key={student.id} className="space-y-4">
            {/* Child header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</h2>
                  <p className="text-xs text-slate-500">Class {student.class}</p>
                </div>
              </div>
              {avgPercentage !== null && (
                <div className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-900/20 px-3 py-1.5 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                  <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                    {avgPercentage.toFixed(1)}% avg
                  </span>
                </div>
              )}
            </div>

            {student.results.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                  <Star className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-400 text-sm">No results published yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {student.results.map((result, i) => (
                  <Card key={i} className="hover:shadow-md transition-shadow group">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                          {result.examName}
                        </CardTitle>
                        <Badge variant="outline" className={`text-xs flex-shrink-0 ${gradeColor(result.grade)}`}>
                          {result.grade}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Score bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                          <span>{result.marks} / {result.maxMarks} marks</span>
                          <span className="font-medium text-slate-600">{result.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              result.percentage >= 75
                                ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                                : result.percentage >= 50
                                  ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                  : "bg-gradient-to-r from-red-400 to-red-500"
                            }`}
                            style={{ width: `${Math.min(100, result.percentage)}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">
                        {new Date(result.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
