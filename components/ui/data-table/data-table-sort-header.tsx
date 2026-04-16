"use client"

import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { cn } from "@/lib/utils"

interface DataTableSortHeaderProps {
  label: string
  sortKey: string
  className?: string
}

export function DataTableSortHeader({ label, sortKey, className }: DataTableSortHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentSortKey = searchParams.get("sort_by")
  const currentSortDir = searchParams.get("sort_dir")
  
  const isActive = currentSortKey === sortKey
  const isAsc = isActive && currentSortDir === "asc"
  const isDesc = isActive && currentSortDir === "desc"

  const toggleSorting = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (!isActive) {
        params.set("sort_by", sortKey)
        params.set("sort_dir", "asc")
      } else if (isAsc) {
        params.set("sort_dir", "desc")
      } else {
        params.delete("sort_by")
        params.delete("sort_dir")
      }
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8 data-[active=true]:bg-accent", className, isPending && "opacity-50")}
      data-active={isActive}
      onClick={toggleSorting}
      disabled={isPending}
    >
      <span>{label}</span>
      {isAsc ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : isDesc ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  )
}
