import { Suspense } from "react"
import { InvoicesTable } from "@/components/invoices/invoices-table"
import { InvoicesPageClient } from "@/components/invoices/invoices-page-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, DollarSign, CheckCircle, Clock, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { getInvoices, getInvoiceSummary } from "@/lib/dal/invoices"
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination"
import Link from "next/link"

export const metadata = { title: "Invoices | SchoolPay" }

export default async function InvoicesPage(props: {
  searchParams?: Promise<{ query?: string; page?: string }>
}) {
  const searchParams = await props.searchParams
  const query = searchParams?.query || ""
  const currentPage = Number(searchParams?.page) || 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage and track student invoices</p>
        </div>
        <InvoicesPageClient />
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <InvoiceStatsFetcher />
      </Suspense>

      <div className="flex items-center gap-4">
        <form method="GET" className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="query" defaultValue={query} placeholder="Search invoices..." className="pl-10" />
        </form>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <Suspense key={`${query}-${currentPage}`} fallback={<TableSkeleton />}>
        <InvoiceDataFetcher search={query} page={currentPage} />
      </Suspense>
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6 h-[88px] animate-pulse bg-muted/50 rounded-xl" />
        </Card>
      ))}
    </div>
  )
}

async function InvoiceStatsFetcher() {
  const stats = await getInvoiceSummary()

  const invoiceStats = [
    { label: "Total Collected", value: `₹${stats.totalCollected.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: "bg-primary/10 text-primary" },
    { label: "Total Pending", value: `₹${stats.totalPending.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: Clock, color: "bg-yellow-100 text-yellow-600" },
    { label: "Overdue", value: `₹${stats.totalOverdue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: FileText, color: "bg-red-100 text-red-600" },
    { label: "Total Invoices", value: stats.invoiceCount.toString(), icon: CheckCircle, color: "bg-blue-100 text-blue-600" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {invoiceStats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function InvoiceDataFetcher({ search, page }: { search: string, page: number }) {
  const { invoices, totalPages } = await getInvoices({ limit: 10, page, query: search })

  return (
    <div className="space-y-4">
      <InvoicesTable invoices={invoices} />
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious href={`/dashboard/invoices?page=${page - 1}${search ? `&query=${encodeURIComponent(search)}` : ''}`} />
              </PaginationItem>
            )}
            <div className="text-sm text-muted-foreground mx-4">
              Page {page} of {totalPages}
            </div>
            {page < totalPages && (
              <PaginationItem>
                <PaginationNext href={`/dashboard/invoices?page=${page + 1}${search ? `&query=${encodeURIComponent(search)}` : ''}`} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
