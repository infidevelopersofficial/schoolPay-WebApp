"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddTeacherForm } from "@/components/forms/add-teacher-form"

export function TeachersPageClient() {
  const [showAddForm, setShowAddForm] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button className="gap-2" onClick={() => setShowAddForm(true)}>
        <Plus className="h-4 w-4" />
        Add Teacher
      </Button>
      <AddTeacherForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}
