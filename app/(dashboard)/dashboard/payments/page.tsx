import { Suspense } from "react"
import { PaymentsTable } from "@/components/payments/payments-table"
import { PaymentsPageClient } from "@/components/payments/payments-page-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { getPayments } from "@/lib/dal/payments"

export const metadata = { title: "Payments | SchoolPay" }

export default async function PaymentsPage(props: {
  searchParams?: Promise<{ query?: string }>
}) {
  const searchParams = await props.searchParams
  const query = searchParams?.query || ""

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground">Track and manage fee payments</p>
        </div>
        <PaymentsPageClient />
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <PaymentStatsFetcher />
      </Suspense>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search payments..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <Suspense key={query} fallback={<TableSkeleton />}>
        <PaymentDataFetcher search={query} />
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

async function PaymentStatsFetcher() {
  const schoolId = await (await import("@/lib/tenant-context")).getSchoolId()

  const [totalAgg, statusGroups] = await Promise.all([
    (await import("@/lib/prisma")).prisma.payment.aggregate({
      where: { schoolId, status: "COMPLETED" },
      _sum: { amount: true },
    }),
    (await import("@/lib/prisma")).prisma.payment.groupBy({
      by: ["status"],
      where: { schoolId },
      _count: { id: true },
    }),
  ])

  const byStatus = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count.id])
  )

  const totalReceived = totalAgg._sum.amount ?? 0
  const successfulCount = byStatus["COMPLETED"] ?? 0
  const pendingCount = byStatus["PENDING"] ?? 0
  const failedCount = byStatus["FAILED"] ?? 0

  const paymentStats = [
    { label: "Total Received", value: `₹${totalReceived.toLocaleString()}`, icon: DollarSign, color: "bg-primary/10 text-primary" },
    { label: "Successful", value: successfulCount.toString(), icon: CheckCircle, color: "bg-green-100 text-green-600" },
    { label: "Pending", value: pendingCount.toString(), icon: Clock, color: "bg-yellow-100 text-yellow-600" },
    { label: "Failed", value: failedCount.toString(), icon: XCircle, color: "bg-red-100 text-red-600" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {paymentStats.map((stat, index) => (
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

async function PaymentDataFetcher({ search }: { search: string }) {
  let { payments } = await getPayments({ limit: 100 })

  if (search) {
    const lowerSearch = search.toLowerCase()
    payments = payments.filter(p => 
      p.receiptNumber?.toLowerCase().includes(lowerSearch) ||
      p.feeType.toLowerCase().includes(lowerSearch) ||
      (p.student?.name && p.student.name.toLowerCase().includes(lowerSearch))
    )
  }

  // Payments returned from prisma might have some dates as Date objects or strings, 
  // PaymentsTable expects an array with `student` correctly shaped.
  return <PaymentsTable payments={payments as any} />
}
