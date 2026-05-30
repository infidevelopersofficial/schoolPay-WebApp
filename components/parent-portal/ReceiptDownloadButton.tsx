"use client"

import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"

interface ReceiptDownloadButtonProps {
  payment: any
  student: any
}

export function ReceiptDownloadButton({ payment, student }: ReceiptDownloadButtonProps) {
  function generateReceipt() {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(22)
    doc.text("SchoolPay", 14, 20)
    doc.setFontSize(16)
    doc.text("Payment Receipt", 14, 30)
    
    // Details
    doc.setFontSize(11)
    doc.text(`Receipt No: ${payment.receiptNumber}`, 14, 45)
    doc.text(`Date: ${new Date(payment.date).toLocaleDateString('en-IN')}`, 14, 52)
    doc.text(`Student Name: ${student.name}`, 14, 59)
    doc.text(`Student ID: ${student.studentId || ''}`, 14, 66)
    doc.text(`Class: ${student.class}`, 14, 73)
    
    // Table
    const tableData = [
      [payment.feeType, `Rs. ${payment.amount.toFixed(2)}`]
    ]
    
    ;(doc as any).autoTable({
      startY: 85,
      head: [['Description', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    })
    
    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 85
    doc.text(`Total Paid: Rs. ${payment.amount.toFixed(2)}`, 14, finalY + 10)
    doc.text(`Payment Method: ${payment.paymentMethod || 'Online'}`, 14, finalY + 17)
    
    doc.text("Thank you for your payment.", 14, finalY + 35)
    
    doc.save(`Receipt_${payment.receiptNumber}.pdf`)
  }

  return (
    <Button size="icon" variant="ghost" onClick={generateReceipt} title="Download Receipt">
      <FileText className="h-4 w-4 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100" />
    </Button>
  )
}
