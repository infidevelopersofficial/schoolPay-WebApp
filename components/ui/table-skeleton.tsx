import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function TableSkeleton() {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-4 border-b pb-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-6 w-24" />
        ))}
      </div>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
          <div className="flex items-center gap-3 w-1/4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </Card>
  )
}
