"use client"

import { useState } from "react"
import { deleteAnnouncementAction } from "@/app/(dashboard)/dashboard/announcements/actions"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"
import { Trash2 } from "lucide-react"

export function DeleteAnnouncementButton({ id }: { id: string }) {
  const { toast } = useToast()

  const handleDelete = async () => {
    const result = await deleteAnnouncementAction(id)
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Announcement deleted successfully.",
      })
    }
  }

  return (
    <ConfirmDeleteDialog
      title="Delete Announcement?"
      description="This will permanently delete this announcement. This action cannot be undone."
      triggerText="Delete"
      triggerVariant="destructive"
      onConfirm={handleDelete}
    />
  )
}
