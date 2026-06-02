"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { RecordPaymentForm } from "@/components/forms"

export function PaymentsPageClient() {
  const [showRecordForm, setShowRecordForm] = useState(false)

  const handleSuccess = useCallback(() => {
    setShowRecordForm(false)
  }, [])

  return (
    <>
      <Button className="gap-2" onClick={() => setShowRecordForm(true)}>
        <Plus className="h-4 w-4" />
        Record Payment
      </Button>

      <RecordPaymentForm 
        open={showRecordForm} 
        onOpenChange={setShowRecordForm} 
        onSuccess={handleSuccess} 
      />
    </>
  )
}
