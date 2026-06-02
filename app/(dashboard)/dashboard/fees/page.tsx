import { Suspense } from "react"
import { getFees } from "@/lib/dal/fees"
import { FeesContent } from "@/components/fees/fees-content"
import { FeesPageClient } from "@/components/fees/fees-page-client"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export const metadata = { title: "Fees | SchoolPay" }

export default async function FeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fee Management</h1>
          <p className="text-sm text-muted-foreground">Manage fee structure, discounts, and penalties</p>
        </div>
        <FeesPageClient />
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <FeeDataFetcher />
      </Suspense>
    </div>
  )
}

async function FeeDataFetcher() {
  const fees = await getFees()
  return <FeesContent fees={fees} />
}
