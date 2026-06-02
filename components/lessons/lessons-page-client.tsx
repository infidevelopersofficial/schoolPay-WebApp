"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateLessonForm } from "@/components/forms"

export function LessonsPageClient() {
  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleSuccess = useCallback(() => {
    setShowCreateForm(false)
  }, [])

  return (
    <>
      <Button className="gap-2" onClick={() => setShowCreateForm(true)}>
        <Plus className="h-4 w-4" />
        Create Lesson
      </Button>

      <CreateLessonForm 
        open={showCreateForm} 
        onOpenChange={setShowCreateForm} 
        onSuccess={handleSuccess} 
      />
    </>
  )
}
