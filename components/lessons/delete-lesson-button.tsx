"use client"

import { deleteLessonAction } from "@/app/(dashboard)/dashboard/lessons/actions"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"

export function DeleteLessonButton({ id }: { id: string }) {
  const { toast } = useToast()

  const handleDelete = async () => {
    const result = await deleteLessonAction(id)
    if (result?.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Lesson cancelled successfully.",
      })
    }
  }

  return (
    <ConfirmDeleteDialog
      title="Cancel Lesson?"
      description="This will cancel this lesson. It will be hidden from the active schedule."
      triggerText="Cancel"
      triggerVariant="destructive"
      onConfirm={handleDelete}
    />
  )
}
