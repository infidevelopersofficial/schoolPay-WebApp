"use client"

import { deleteFeeStructureAction } from "@/app/(dashboard)/dashboard/fees/actions"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"

export function DeleteFeeStructureButton({ id }: { id: string }) {
  const { toast } = useToast()

  const handleDelete = async () => {
    const result = await deleteFeeStructureAction(id)
    if (result?.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Fee structure deleted successfully.",
      })
    }
  }

  return (
    <ConfirmDeleteDialog
      title="Archive Fee Structure?"
      description="This will archive this fee structure. Any existing invoices linked to it will be unaffected."
      triggerText="Delete"
      triggerVariant="destructive"
      onConfirm={handleDelete}
    />
  )
}
