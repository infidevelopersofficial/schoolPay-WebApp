"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddClassForm } from "@/components/forms"

export function ClassesPageClient() {
  const [showAddForm, setShowAddForm] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button className="gap-2" onClick={() => setShowAddForm(true)}>
        <Plus className="h-4 w-4" />
        Add Class
      </Button>
      <AddClassForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}
