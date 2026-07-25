import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export function generateReceiptPdf(payment: any, student: any) {
  const doc = new jsPDF()

  // ── Header ──────────────────────────────────────────────
  doc.setFillColor(0, 51, 102)
  doc.rect(0, 0, 210, 30, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("SchoolPay", 14, 13)

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text("Payment Receipt", 14, 22)

  // Receipt badge (right-aligned)
  doc.setFontSize(10)
  doc.text(`Receipt: ${payment.receiptNumber || "N/A"}`, 196, 13, { align: "right" })
  doc.text(`Date: ${new Date(payment.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, 196, 22, { align: "right" })

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // ── Student Details ─────────────────────────────────────
  const studentName = student?.name || "Unknown Student"
  const studentId = student?.studentId || "N/A"
  const studentClass = student?.class || "N/A"

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Student Details", 14, 44)

  doc.setDrawColor(220, 220, 220)
  doc.line(14, 46, 196, 46)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Name:`, 14, 54)
  doc.setFont("helvetica", "bold")
  doc.text(studentName, 50, 54)

  doc.setFont("helvetica", "normal")
  doc.text(`Student ID:`, 14, 61)
  doc.setFont("helvetica", "bold")
  doc.text(studentId, 50, 61)

  doc.setFont("helvetica", "normal")
  doc.text(`Class:`, 14, 68)
  doc.setFont("helvetica", "bold")
  doc.text(studentClass, 50, 68)

  // ── Payment Table ───────────────────────────────────────
  autoTable(doc, {
    startY: 80,
    head: [["Description", "Payment Method", "Amount"]],
    body: [
      [
        payment.feeType || "General Fee",
        payment.paymentMethod || "—",
        `\u20B9${(payment.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      ],
    ],
    foot: [["", "Total Paid", `\u20B9${(payment.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`]],
    theme: "grid",
    headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: { 2: { halign: "right" } },
  })

  // ── Footer ──────────────────────────────────────────────
  const finalY: number = (doc as any).lastAutoTable?.finalY ?? 130

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text("This is a computer-generated receipt and does not require a signature.", 105, finalY + 18, { align: "center" })
  doc.text("Thank you for your payment.", 105, finalY + 24, { align: "center" })

  doc.save(`Receipt_${payment.receiptNumber || payment.id || "download"}.pdf`)
}
