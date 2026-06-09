import { Suspense } from "react"
import { getResultsExamGroups } from "@/lib/dal/results"
import { ResultsDashboardClient } from "@/components/results/results-dashboard-client"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export const metadata = { title: "Results & Exam Groups | SchoolPay" }

export default async function ResultsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exam Results</h1>
          <p className="text-sm text-muted-foreground">Manage exam marks, grading, and report cards.</p>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <ResultsDataFetcher />
      </Suspense>
    </div>
  )
}

async function ResultsDataFetcher() {
  const examGroups = await getResultsExamGroups()
  return <ResultsDashboardClient examGroups={examGroups} />
}
