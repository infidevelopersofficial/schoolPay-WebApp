"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ComposeMessageForm } from "@/components/forms"

export function MessagesPageClient() {
  const [showComposeForm, setShowComposeForm] = useState(false)

  const handleSuccess = useCallback(() => {
    setShowComposeForm(false)
  }, [])

  return (
    <>
      <Button className="gap-2" onClick={() => setShowComposeForm(true)}>
        <Plus className="h-4 w-4" />
        Compose
      </Button>

      <ComposeMessageForm 
        open={showComposeForm} 
        onOpenChange={setShowComposeForm} 
        onSuccess={handleSuccess} 
      />
    </>
  )
}
