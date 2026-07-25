import { Suspense } from "react"
import { TeachersTable } from "@/components/teachers/teachers-table"
import { Button } from "@/components/ui/button"
import { TeachersPageClient } from "@/components/teachers/teachers-page-client"
import { getTeachers } from "@/lib/dal/teachers"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { DataTableShell } from "@/components/ui/data-table/data-table-shell"
import { DataTableSearch } from "@/components/ui/data-table/data-table-search"
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination"
import Link from "next/link"
import { getClasses } from "@/lib/dal/classes"
import { getSubjects } from "@/lib/dal/subjects"

export const metadata = { title: "Teachers | SchoolPay" }

export default async function TeachersPage(props: {
  searchParams?: Promise<{ page?: string; query?: string }>
}) {
  const searchParams = await props.searchParams
  const currentPage = Number(searchParams?.page) || 1
  const query = searchParams?.query || ""
  
  const classes = await getClasses()
  const subjects = await getSubjects()

  return (
    <DataTableShell
      title="Teachers"
      description="Manage teacher records and assignments"
      breadcrumbs={[{ label: "People" }]}
      search={<DataTableSearch query={query} placeholder="Search teachers..." />}
      actions={<TeachersPageClient classes={classes} subjects={subjects} />}
    >
      <Suspense key={query + currentPage} fallback={<TableSkeleton />}>
        <TeacherDataFetcher page={currentPage} search={query} />
      </Suspense>
    </DataTableShell>
  )
}

async function TeacherDataFetcher({ page, search }: { page: number; search: string }) {
  const { teachers, totalPages } = await getTeachers({ page, limit: 10, search })
  const formattedTeachers = teachers.map(t => ({
    id: t.id,
    name: t.name,
    email: t.email,
    phone: t.phone,
    avatar: t.avatar,
    isActive: t.isActive,
    subject: t.subjects?.filter(s => s.isActive)?.map(s => s.subject.name).join(", ") || (t as any).subject || "N/A",
    class: t.classAssignments?.filter(c => c.isActive)?.map(c => `${c.class.name}-${c.class.section}`).join(", ") || (t as any).class || "N/A",
  }))

  return (
    <>
      <TeachersTable data={formattedTeachers} />
      <DataTablePagination currentPage={page} totalPages={totalPages} />
    </>
  )
}
