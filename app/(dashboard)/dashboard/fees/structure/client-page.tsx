"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Download, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { addFeeAction, deleteFeeAction } from "../actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export const createFeeSchema = z.object({
  type: z.string().min(1, "Fee type is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"]),
  dueDate: z.string().optional(),
  className: z.string().optional(),
  sessionId: z.string().optional(),
})

export type CreateFeeInput = z.infer<typeof createFeeSchema>

export function StructureClient({ initialFees, sessions }: { initialFees: any[], sessions: any[] }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [feeToDelete, setFeeToDelete] = useState<any>(null)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleDelete() {
    if (!feeToDelete) return;
    setIsSubmitting(true)
    const result = await deleteFeeAction(feeToDelete.id)
    setIsSubmitting(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Fee head deleted successfully")
      setFeeToDelete(null)
      router.refresh()
    }
  }

  const form = useForm<CreateFeeInput>({
    resolver: zodResolver(createFeeSchema),
    defaultValues: {
      type: "",
      amount: 0,
      description: "",
      frequency: "MONTHLY",
      dueDate: "",
      className: "",
      sessionId: sessions.length > 0 ? sessions[0].id : "",
    },
  })

  async function onSubmit(data: CreateFeeInput) {
    setIsSubmitting(true)
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    })

    const result = await addFeeAction(null, formData)
    
    setIsSubmitting(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Fee structure created successfully.")
      setShowAddForm(false)
      form.reset()
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fee Structure Setup</h1>
          <p className="text-sm text-muted-foreground">Define fee heads per class and academic session.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4" />
          Add Fee Head
        </Button>
      </div>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Fee Head</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Fee Name/Type *</Label>
              <Input id="type" {...form.register("type")} placeholder="e.g. Tuition Fee" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input id="amount" type="number" {...form.register("amount")} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select onValueChange={(val) => form.setValue("frequency", val as any)} defaultValue={form.getValues("frequency")}>
                  <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                    <SelectItem value="ONE_TIME">One Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="className">Class *</Label>
                <Input id="className" {...form.register("className")} placeholder="e.g. 10A or All" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionId">Academic Year *</Label>
                <Select onValueChange={(val) => form.setValue("sessionId", val)} defaultValue={form.getValues("sessionId")}>
                  <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input id="dueDate" {...form.register("dueDate")} placeholder="e.g. 5th of every month" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input id="description" {...form.register("description")} placeholder="Details about this fee" />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Fee Head"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!feeToDelete} onOpenChange={(open) => !open && setFeeToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee Head</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this fee head? This cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setFeeToDelete(null)} disabled={isSubmitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fee Type</TableHead>
              <TableHead>Amount (₹)</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialFees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No fee structures defined yet. Click "Add Fee Head" to create one.
                </TableCell>
              </TableRow>
            ) : initialFees.map((fee) => (
              <TableRow key={fee.id}>
                <TableCell className="font-medium">
                  {fee.type}
                  <div className="text-xs text-muted-foreground">{fee.description}</div>
                </TableCell>
                <TableCell className="font-semibold text-primary">₹{fee.amount}</TableCell>
                <TableCell>{fee.className || "All"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{fee.frequency}</Badge>
                </TableCell>
                <TableCell className="text-sm">{fee.dueDate || "—"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-red-600" onClick={() => setFeeToDelete(fee)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Disable
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
