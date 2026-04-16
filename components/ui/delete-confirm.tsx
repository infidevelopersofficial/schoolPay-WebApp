"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { buttonVariants } from "@/components/ui/button"

interface DeleteConfirmProps {
  /** The human-readable name of the record being deleted (shown in the dialog). */
  name: string
  /** Called when the user confirms the deletion. */
  onConfirm: () => void | Promise<void>
}

/**
 * A "Delete" dropdown item that opens an AlertDialog confirmation before calling onConfirm.
 * Renders inside a DropdownMenuContent — does NOT wrap an outer DropdownMenu itself.
 */
export function DeleteConfirm({ name, onConfirm }: DeleteConfirmProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <DropdownMenuItem
        className="text-destructive focus:text-destructive"
        onSelect={(e) => {
          // Prevent the dropdown from closing before the dialog opens
          e.preventDefault()
          setOpen(true)
        }}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{name}</strong> from the system. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => {
                setOpen(false)
                onConfirm()
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
