import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton"

export default function Loading() {
  return (
    <DashboardLayout>
      <PageLoadingSkeleton />
    </DashboardLayout>
  )
}
