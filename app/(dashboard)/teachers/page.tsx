import { Suspense } from "react"
import { TeachersTable } from "@/components/teachers/teachers-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getTeachers } from "@/lib/dal/teachers"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { DataTableShell } from "@/components/ui/data-table/data-table-shell"
import { DataTableSearch } from "@/components/ui/data-table/data-table-search"
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination"
import Link from "next/link"

export const metadata = { title: "Teachers | SchoolPay" }

export default async function TeachersPage(props: {
  searchParams?: Promise<{ page?: string; query?: string }>
}) {
  const searchParams = await props.searchParams
  const currentPage = Number(searchParams?.page) || 1
  const query = searchParams?.query || ""

  return (
    <DataTableShell
      title="Teachers"
      description="Manage teacher records and assignments"
      breadcrumbs={[{ label: "People" }]}
      search={<DataTableSearch query={query} placeholder="Search teachers..." />}
      actions={
        <Button className="gap-2" asChild>
          <Link href="/teachers/new">
            <Plus className="h-4 w-4" />
            Add Teacher
          </Link>
        </Button>
      }
    >
      <Suspense key={query + currentPage} fallback={<TableSkeleton />}>
        <TeacherDataFetcher page={currentPage} search={query} />
      </Suspense>
    </DataTableShell>
  )
}

async function TeacherDataFetcher({ page, search }: { page: number; search: string }) {
  const { teachers, totalPages } = await getTeachers({ page, limit: 10, search })
  return (
    <>
      <TeachersTable data={teachers} />
      <DataTablePagination currentPage={page} totalPages={totalPages} />
    </>
  )
}
