"use client"

import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useTransition } from "react"

interface DataTablePaginationProps {
  currentPage: number
  totalPages: number
}

export function DataTablePagination({ currentPage, totalPages }: DataTablePaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-2 py-4 border-t">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            startTransition(() => {
              router.push(createPageURL(currentPage - 1))
            })
          }}
          disabled={currentPage <= 1 || isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ChevronLeft className="h-4 w-4 mr-1" />}
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            startTransition(() => {
              router.push(createPageURL(currentPage + 1))
            })
          }}
          disabled={currentPage >= totalPages || isPending}
        >
          Next
          {isPending ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </div>
  )
}
