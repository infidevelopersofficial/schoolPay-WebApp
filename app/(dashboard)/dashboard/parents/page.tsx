import { Suspense } from "react"
import { ParentsTable } from "@/components/parents/parents-table"
import { Button } from "@/components/ui/button"
import { ParentsPageClient } from "@/components/parents/parents-page-client"
import { getParents } from "@/lib/dal/parents"
import { getStudents } from "@/lib/dal/students"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { DataTableShell } from "@/components/ui/data-table/data-table-shell"
import { DataTableSearch } from "@/components/ui/data-table/data-table-search"
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination"
import Link from "next/link"

export const metadata = { title: "Parents & Guardians | SchoolPay" }

export default async function ParentsPage(props: {
  searchParams?: Promise<{ page?: string; query?: string }>
}) {
  const searchParams = await props.searchParams
  const currentPage = Number(searchParams?.page) || 1
  const query = searchParams?.query || ""

  // We no longer prefetch 500 students. AsyncMultiSelect fetches on demand.
  const students: any[] = []

  return (
    <DataTableShell
      title="Parents & Guardians"
      description="Manage parent and guardian information"
      breadcrumbs={[{ label: "People" }]}
      search={<DataTableSearch query={query} placeholder="Search parents..." />}
      actions={<ParentsPageClient students={students} />}
    >
      <Suspense key={query + currentPage} fallback={<TableSkeleton />}>
        <ParentDataFetcher page={currentPage} search={query} />
      </Suspense>
    </DataTableShell>
  )
}

async function ParentDataFetcher({ page, search }: { page: number; search: string }) {
  const { parents, totalPages } = await getParents({ page, limit: 10, search })
  return (
    <>
      <ParentsTable data={parents} />
      <DataTablePagination currentPage={page} totalPages={totalPages} />
    </>
  )
}
