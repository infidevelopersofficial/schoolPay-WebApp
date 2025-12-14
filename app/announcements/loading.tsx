import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageSkeleton } from "@/components/dashboard/loading-skeleton"

export default function Loading() {
  return (
    <DashboardLayout>
      <PageSkeleton />
    </DashboardLayout>
  )
}
