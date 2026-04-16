"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { Loader2 } from "lucide-react"

interface DataTableFilterProps {
  filterKey: string
  title: string
  options: { label: string; value: string }[]
}

export function DataTableFilter({ filterKey, title, options }: DataTableFilterProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const currentValue = searchParams.get(filterKey) || "all"

  const handleValueChange = (value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === "all") {
        params.delete(filterKey)
      } else {
        params.set(filterKey, value)
      }
      params.delete("page") // Reset to page 1 on new filter
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="relative">
      <Select value={currentValue} onValueChange={handleValueChange} disabled={isPending}>
        <SelectTrigger className="w-[180px]">
          <div className="flex items-center gap-2">
           {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
           <SelectValue placeholder={title} />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All {title}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
