"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddFeeForm } from "@/components/forms"

export function FeesPageClient() {
  const [showAddForm, setShowAddForm] = useState(false)

  const handleSuccess = useCallback(() => {
    setShowAddForm(false)
  }, [])

  return (
    <>
      <Button className="gap-2" onClick={() => setShowAddForm(true)}>
        <Plus className="h-4 w-4" />
        Add Fee Type
      </Button>

      <AddFeeForm 
        open={showAddForm} 
        onOpenChange={setShowAddForm} 
        onSuccess={handleSuccess} 
      />
    </>
  )
}
