"use client"

import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { generateReceiptPdf } from "@/lib/utils/receipt"

interface ReceiptDownloadButtonProps {
  payment: any
  student: any
}

export function ReceiptDownloadButton({ payment, student }: ReceiptDownloadButtonProps) {
  function generateReceipt() {
    generateReceiptPdf(payment, student)
  }

  return (
    <Button size="icon" variant="ghost" onClick={generateReceipt} title="Download Receipt">
      <FileText className="h-4 w-4 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100" />
    </Button>
  )
}

