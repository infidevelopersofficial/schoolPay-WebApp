"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export function FeesPageClient() {
  return (
    <Link href="/dashboard/fees/wizard" passHref>
      <Button className="gap-2">
        <Plus className="h-4 w-4" />
        Create Fee Structure
      </Button>
    </Link>
  )
}
