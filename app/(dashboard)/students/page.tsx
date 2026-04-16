import { Suspense } from "react"
import { StudentsTable } from "@/components/students/students-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { DataTableShell } from "@/components/ui/data-table/data-table-shell"
import { DataTableSearch } from "@/components/ui/data-table/data-table-search"
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination"
import { DataTableFilter } from "@/components/ui/data-table/data-table-filter"
import { getStudents } from "@/lib/dal/students"
import Link from "next/link"

export const metadata = { title: "Students | SchoolPay" }

export default async function StudentsPage(props: {
  searchParams?: Promise<{ page?: string; query?: string; classFilter?: string; statusFilter?: string; sort_by?: string; sort_dir?: string }>
}) {
  const searchParams = await props.searchParams
  const currentPage = Number(searchParams?.page) || 1
  const query = searchParams?.query || ""
  const classFilter = searchParams?.classFilter || ""
  const statusFilter = searchParams?.statusFilter || ""
  const sortBy = searchParams?.sort_by || ""
  const sortDir = searchParams?.sort_dir || ""

  return (
    <DataTableShell
      title="Students"
      description="Manage student records and information"
      breadcrumbs={[{ label: "People" }]}
      search={
        <>
          <DataTableSearch query={query} placeholder="Search students..." />
          <DataTableFilter
            title="Class"
            filterKey="classFilter"
            options={[
              { label: "Grade 10A", value: "Grade 10A" },
              { label: "Grade 10B", value: "Grade 10B" },
              { label: "Grade 11A", value: "Grade 11A" },
              { label: "Grade 12A", value: "Grade 12A" },
            ]}
          />
          <DataTableFilter
            title="Fee Status"
            filterKey="statusFilter"
            options={[
              { label: "Paid", value: "PAID" },
              { label: "Pending", value: "PENDING" },
              { label: "Overdue", value: "OVERDUE" },
            ]}
          />
        </>
      }
      actions={
        <Button className="gap-2" asChild>
          <Link href="/students/new">
            <Plus className="h-4 w-4" />
            Add Student
          </Link>
        </Button>
      }
    >
      <Suspense key={query + currentPage + classFilter + statusFilter + sortBy + sortDir} fallback={<TableSkeleton />}>
        <StudentDataFetcher 
          page={currentPage} 
          search={query} 
          classFilter={classFilter}
          feeStatus={statusFilter}
          sortBy={sortBy}
          sortDir={sortDir}
        />
      </Suspense>
    </DataTableShell>
  )
}

async function StudentDataFetcher({ page, search, classFilter, feeStatus, sortBy, sortDir }: { page: number; search: string; classFilter: string; feeStatus: string; sortBy: string; sortDir: string; }) {
  const { students, totalPages } = await getStudents({ 
    page, 
    limit: 10, 
    search,
    classFilter: classFilter || undefined,
    feeStatus: feeStatus || undefined,
    sortBy: sortBy || undefined,
    sortDir: (sortDir as "asc" | "desc") || undefined
  })
  return (
    <>
      <StudentsTable data={students} />
      <DataTablePagination currentPage={page} totalPages={totalPages} />
    </>
  )
}
