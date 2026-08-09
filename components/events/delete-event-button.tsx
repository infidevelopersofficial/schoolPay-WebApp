"use client"

import { deleteEventAction } from "@/app/(dashboard)/dashboard/events/actions"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"

export function DeleteEventButton({ id }: { id: string }) {
  const { toast } = useToast()

  const handleDelete = async () => {
    const result = await deleteEventAction(id)
    if (result?.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Event cancelled successfully.",
      })
    }
  }

  return (
    <ConfirmDeleteDialog
      title="Cancel Event?"
      description="This will cancel this event. It will no longer appear in the active calendar."
      triggerText="Cancel"
      triggerVariant="destructive"
      onConfirm={handleDelete}
    />
  )
}
