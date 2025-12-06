import { cn } from "@/lib/utils"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StatCardProps {
  title: string
  value: string | number
  year: string
  color: "purple" | "yellow" | "blue" | "green"
}

const colorClasses = {
  purple: "bg-[#c3b5fd]",
  yellow: "bg-[#fef08a]",
  blue: "bg-[#93c5fd]",
  green: "bg-[#86efac]",
}

export function StatCard({ title, value, year, color }: StatCardProps) {
  return (
    <div className={cn("rounded-xl p-5 relative", colorClasses[color])}>
      <div className="flex items-start justify-between">
        <span className="inline-flex items-center rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-medium">
          {year}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-foreground">{value.toLocaleString()}</p>
        <p className="text-sm font-medium text-foreground/70 mt-1">{title}</p>
      </div>
    </div>
  )
}
