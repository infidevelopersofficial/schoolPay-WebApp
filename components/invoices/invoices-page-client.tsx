"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export function InvoicesPageClient() {
  return (
    <Link href="/dashboard/invoices/new" passHref>
      <Button className="gap-2">
        <Plus className="h-4 w-4" />
        New Invoice
      </Button>
    </Link>
  )
}
