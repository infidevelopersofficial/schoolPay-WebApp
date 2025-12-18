"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { db } from "@/lib/db/database"
import { toast } from "sonner"

interface RecordPaymentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RecordPaymentForm({ open, onOpenChange, onSuccess }: RecordPaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    studentId: "",
    studentName: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    method: "",
    feeType: "",
    transactionId: "",
    receiptNumber: "",
  })

  const students = db.getStudents()
  const fees = db.getFees()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.studentId || !formData.amount || !formData.method) {
        toast.error("Please fill in all required fields")
        setLoading(false)
        return
      }

      // Add payment
      db.addPayment({
        studentId: formData.studentId,
        studentName: formData.studentName,
        amount: parseFloat(formData.amount),
        date: formData.date,
        method: formData.method as any,
        status: "Completed",
        feeType: formData.feeType,
        transactionId: formData.transactionId,
        receiptNumber: formData.receiptNumber || `RCP${Date.now()}`,
      })

      // Update student fee status
      const student = db.getStudent(formData.studentId)
      if (student) {
        const newPaidAmount = student.paidAmount + parseFloat(formData.amount)
        const newPendingAmount = student.totalFees - newPaidAmount
        db.updateStudent(formData.studentId, {
          paidAmount: newPaidAmount,
          pendingAmount: newPendingAmount,
          feeStatus: newPendingAmount <= 0 ? "Paid" : newPendingAmount > student.totalFees * 0.5 ? "Overdue" : "Pending",
        })
      }

      toast.success("Payment recorded successfully!")
      setFormData({
        studentId: "",
        studentName: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        method: "",
        feeType: "",
        transactionId: "",
        receiptNumber: "",
      })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error recording payment:", error)
      toast.error("Failed to record payment")
    } finally {
      setLoading(false)
    }
  }

  const handleStudentChange = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    if (student) {
      setFormData({ ...formData, studentId, studentName: student.name })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Student <span className="text-red-500">*</span></Label>
            <Select value={formData.studentId} onValueChange={handleStudentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} - {student.class} (Pending: ${student.pendingAmount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fee Type</Label>
            <Select value={formData.feeType} onValueChange={(value) => setFormData({ ...formData, feeType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select fee type" />
              </SelectTrigger>
              <SelectContent>
                {fees.map((fee) => (
                  <SelectItem key={fee.id} value={fee.type}>
                    {fee.type} - ${fee.amount}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="5000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Date <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Method <span className="text-red-500">*</span></Label>
            <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Debit Card">Debit Card</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="Online Payment">Online Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Transaction ID</Label>
              <Input
                value={formData.transactionId}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                placeholder="TXN123456"
              />
            </div>

            <div className="space-y-2">
              <Label>Receipt Number</Label>
              <Input
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                placeholder="Auto-generated"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
