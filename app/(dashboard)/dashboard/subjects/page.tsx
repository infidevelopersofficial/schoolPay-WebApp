import { Suspense } from "react"
import { SubjectsTable } from "@/components/subjects/subjects-table"
import { SubjectsPageClient } from "@/components/subjects/subjects-page-client"
import { getSubjects } from "@/lib/dal/subjects"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { DataTableShell } from "@/components/ui/data-table/data-table-shell"
import { DataTableSearch } from "@/components/ui/data-table/data-table-search"

export const metadata = { title: "Subjects | SchoolPay" }

export default async function SubjectsPage(props: {
  searchParams?: Promise<{ query?: string }>
}) {
  const searchParams = await props.searchParams
  const query = searchParams?.query || ""

  return (
    <DataTableShell
      title="Subjects"
      description="Manage subjects and curriculum"
      breadcrumbs={[{ label: "Academics" }]}
      search={<DataTableSearch query={query} placeholder="Search subjects..." />}
      actions={<SubjectsPageClient />}
    >
      <Suspense key={query} fallback={<TableSkeleton />}>
        <SubjectDataFetcher search={query} />
      </Suspense>
    </DataTableShell>
  )
}

async function SubjectDataFetcher({ search }: { search: string }) {
  // getSubjects doesn't currently support search parameter in dal/subjects.ts, 
  // but we can filter it locally or update the DAL later.
  let subjects = await getSubjects()
  
  if (search) {
    const lowerSearch = search.toLowerCase()
    subjects = subjects.filter(s => 
      s.name.toLowerCase().includes(lowerSearch) || 
      s.code.toLowerCase().includes(lowerSearch)
    )
  }

  return <SubjectsTable data={subjects} />
}
