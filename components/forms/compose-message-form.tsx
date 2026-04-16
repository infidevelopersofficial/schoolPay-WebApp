"use client"

import { useActionState, useEffect } from "react"
import { sendMessageAction } from "@/app/(dashboard)/messages/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function ComposeMessageForm({ open, onOpenChange, onSuccess }: any) {
  const [state, formAction, isPending] = useActionState(sendMessageAction, null)

  useEffect(() => {
    if (state?.success) {
      toast.success("Message sent successfully!")
      onOpenChange(false)
      onSuccess?.()
    } else if (state?.error) {
      toast.error(typeof state.error === "string" ? state.error : "Failed to send message")
    }
  }, [state, onOpenChange, onSuccess])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Compose Message</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>To (Name) <span className="text-red-500">*</span></Label>
            <Input name="to" required />
          </div>
          <div className="space-y-2">
            <Label>To (Email) <span className="text-red-500">*</span></Label>
            <Input name="toEmail" type="email" required />
          </div>
          <div className="space-y-2">
            <Label>Subject <span className="text-red-500">*</span></Label>
            <Input name="subject" required />
          </div>
          <div className="space-y-2">
            <Label>Message <span className="text-red-500">*</span></Label>
            <Textarea name="body" className="min-h-[150px]" required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
