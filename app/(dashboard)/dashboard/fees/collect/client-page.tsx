"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FileText, CheckCircle } from "lucide-react"
import { addPaymentAction } from "./actions"
import { toast } from "sonner"
import jsPDF from "jspdf"
import "jspdf-autotable"

export function CollectClient({ searchQuery, searchResults, selectedStudent, pendingFees, pastPayments }: any) {
  const router = useRouter()
  const [query, setQuery] = useState(searchQuery)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedFee, setSelectedFee] = useState<any>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [amountToPay, setAmountToPay] = useState(0)
  const [remarks, setRemarks] = useState("")

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/dashboard/fees/collect?q=${encodeURIComponent(query)}`)
  }

  function openPaymentModal(fee: any) {
    setSelectedFee(fee)
    setAmountToPay(fee.amount)
    setPaymentMethod("CASH")
    setRemarks("")
    setShowPaymentModal(true)
  }

  async function processPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStudent || !selectedFee) return
    setIsSubmitting(true)
    
    const formData = new FormData()
    formData.append("studentId", selectedStudent.id)
    formData.append("amount", amountToPay.toString())
    formData.append("feeType", selectedFee.type)
    formData.append("paymentMethod", paymentMethod)
    if (remarks) formData.append("remarks", remarks)
    if (selectedStudent.sessionId) formData.append("sessionId", selectedStudent.sessionId)

    const result = await addPaymentAction(null, formData)
    setIsSubmitting(false)
    
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Payment recorded successfully!")
      setShowPaymentModal(false)
      
      // Auto-generate receipt
      generateReceipt(result.receiptNumber as string, amountToPay, selectedFee.type)
      
      // Refresh page to update pending and paid lists
      router.push(`/dashboard/fees/collect?studentId=${selectedStudent.id}`)
    }
  }

  function generateReceipt(receiptNo: string, amount: number, type: string) {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(22)
    doc.text("Sunrise Public School", 14, 20)
    
    doc.setFontSize(10)
    doc.text("Shop No. 14, Rashmi Laxmi Sadan, Near Bhayandar East Station,", 14, 27)
    doc.text("Bhayander East - 401105, Thane, Maharashtra", 14, 32)
    doc.text("Phone: 8369704457", 14, 37)

    doc.setFontSize(16)
    doc.text("Payment Receipt", 14, 47)
    
    // Details
    doc.setFontSize(11)
    doc.text(`Receipt No: ${receiptNo}`, 14, 60)
    // DD/MM/YYYY format
    const formattedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
    doc.text(`Date: ${formattedDate}`, 14, 67)
    doc.text(`Student Name: ${selectedStudent.name}`, 14, 74)
    doc.text(`Student ID: ${selectedStudent.studentId || ''}`, 14, 81)
    doc.text(`Class: ${selectedStudent.class}`, 14, 88)
    
    // Table
    const tableData = [
      [type, `₹${amount.toFixed(2)}`]
    ]
    
    ;(doc as any).autoTable({
      startY: 95,
      head: [['Description', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    })
    
    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 95
    doc.text(`Total Paid: ₹${amount.toFixed(2)}`, 14, finalY + 10)
    doc.text(`Payment Method: ${paymentMethod}`, 14, finalY + 17)
    
    doc.text("Thank you for your payment.", 14, finalY + 35)
    
    doc.save(`Receipt_${receiptNo}.pdf`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Collect Fees</h1>
        <p className="text-muted-foreground">Search student and record payments.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input 
              placeholder="Search by student name or ID..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-md"
            />
            <Button type="submit"><Search className="h-4 w-4 mr-2" /> Search</Button>
          </form>

          {searchResults.length > 0 && !selectedStudent && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Search Results</h3>
              <div className="space-y-2">
                {searchResults.map((student: any) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.studentId} • Class {student.class}</p>
                    </div>
                    <Button variant="outline" onClick={() => router.push(`/dashboard/fees/collect?studentId=${student.id}`)}>
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStudent && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Profile Summary */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{selectedStudent.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Student ID</p>
                <p className="font-medium">{selectedStudent.studentId || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-medium">{selectedStudent.class}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Parent Name</p>
                <p className="font-medium">{selectedStudent.parent?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Parent Mobile</p>
                <p className="font-medium">{selectedStudent.parent?.mobile || "N/A"}</p>
              </div>
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/fees/collect")}>
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Fees & Ledger */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Fee Heads</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Head</TableHead>
                      <TableHead>Amount (₹)</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingFees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                          No pending fee heads found.
                        </TableCell>
                      </TableRow>
                    ) : pendingFees.map((fee: any) => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium">
                          {fee.type}
                          <div className="text-xs text-muted-foreground">{fee.description}</div>
                        </TableCell>
                        <TableCell>₹{fee.amount}</TableCell>
                        <TableCell><Badge variant="outline">{fee.frequency}</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => openPaymentModal(fee)}>Pay Now</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount (₹)</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                          No past payments recorded.
                        </TableCell>
                      </TableRow>
                    ) : pastPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs">{payment.receiptNumber}</TableCell>
                        <TableCell>
                          {new Date(payment.date).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "2-digit", year: "numeric"
                          })}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">₹{payment.amount}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => generateReceipt(payment.receiptNumber, payment.amount, payment.feeType)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={processPayment} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Fee Head</Label>
              <Input value={selectedFee?.type || ""} disabled />
            </div>
            
            <div className="space-y-2">
              <Label>Amount to Pay (₹)</Label>
              <Input type="number" value={amountToPay} onChange={(e) => setAmountToPay(Number(e.target.value))} required />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Remarks (Optional)</Label>
              <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Transaction ID, Cheque No, etc." />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t mt-6">
              <Button type="button" variant="ghost" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Confirm Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
