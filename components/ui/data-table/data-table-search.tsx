"use client"

import { Input } from "@/components/ui/input"
import { Search, X, Loader2 } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useTransition } from "react"

interface DataTableSearchProps {
  placeholder?: string
  query?: string
}

export function DataTableSearch({ placeholder = "Search...", query = "" }: DataTableSearchProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(query)
  const [isPending, startTransition] = useTransition()

  // Sync internal state if URL changes externally
  useEffect(() => {
    setSearchTerm(query)
  }, [query])

  // Implement internal 300ms debounce
  useEffect(() => {
    // Prevent routing if it's strictly syncing from prop
    if (searchTerm === query) return 

    const timer = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (searchTerm) {
          params.set("query", searchTerm)
        } else {
          params.delete("query")
        }
        params.delete("page") // Reset to page 1 on new search
        router.push(`${pathname}?${params.toString()}`)
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, pathname, router, searchParams, query])

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        className="pl-10 pr-10"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {isPending ? (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
      ) : searchTerm ? (
        <X
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground"
          onClick={() => setSearchTerm("")}
        />
      ) : null}
    </div>
  )
}
