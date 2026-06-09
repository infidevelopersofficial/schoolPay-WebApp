import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import JSZip from "jszip"

export interface ReportCardData {
  schoolName: string
  studentName: string
  rollNumber: string
  className: string
  examGroupName: string
  subjects: {
    name: string
    maxMarks: number
    marksObtained: number | null
    grade: string | null
    remarks: string | null
  }[]
  attendancePercentage?: number
  teacherRemarks?: string
}

export function generateReportCardPDF(data: ReportCardData): jsPDF {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text(data.schoolName, 105, 20, { align: "center" })

  doc.setFontSize(16)
  doc.setFont("helvetica", "normal")
  doc.text("REPORT CARD", 105, 30, { align: "center" })
  doc.text(data.examGroupName, 105, 38, { align: "center" })

  doc.setLineWidth(0.5)
  doc.line(20, 42, 190, 42)

  // Student Info
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Student Details", 20, 52)
  
  doc.setFont("helvetica", "normal")
  doc.text(`Name: ${data.studentName}`, 20, 60)
  doc.text(`Roll No: ${data.rollNumber || "N/A"}`, 20, 68)
  doc.text(`Class: ${data.className}`, 120, 60)
  if (data.attendancePercentage !== undefined) {
    doc.text(`Attendance: ${data.attendancePercentage}%`, 120, 68)
  }

  // Table Data
  const tableColumn = ["Subject", "Max Marks", "Marks Obtained", "Grade", "Remarks"]
  const tableRows = data.subjects.map(sub => [
    sub.name,
    sub.maxMarks.toString(),
    sub.marksObtained !== null ? sub.marksObtained.toString() : "Absent",
    sub.grade || "-",
    sub.remarks || "-"
  ])

  let totalMax = 0
  let totalObtained = 0
  data.subjects.forEach(sub => {
    totalMax += sub.maxMarks
    if (sub.marksObtained !== null) totalObtained += sub.marksObtained
  })

  // Add a total row
  tableRows.push([
    "TOTAL",
    totalMax.toString(),
    totalObtained.toString(),
    "-",
    "-"
  ])

  autoTable(doc, {
    startY: 80,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [63, 63, 70] },
    willDrawCell: (data) => {
      // Bold the total row
      if (data.row.index === tableRows.length - 1) {
        doc.setFont("helvetica", "bold")
      }
    }
  })

  const finalY = (doc as any).lastAutoTable.finalY || 150

  // Signatures
  doc.setFont("helvetica", "normal")
  doc.text("Class Teacher", 40, finalY + 40, { align: "center" })
  doc.line(20, finalY + 35, 60, finalY + 35)

  doc.text("Principal", 170, finalY + 40, { align: "center" })
  doc.line(150, finalY + 35, 190, finalY + 35)

  return doc
}

export async function generateBulkReportCardsZIP(studentsData: ReportCardData[], filename = "ReportCards.zip") {
  const zip = new JSZip()

  studentsData.forEach(student => {
    const doc = generateReportCardPDF(student)
    // Convert to ArrayBuffer
    const pdfBuffer = doc.output("arraybuffer")
    const safeName = student.studentName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    zip.file(`${safeName}_report_card.pdf`, pdfBuffer)
  })

  const content = await zip.generateAsync({ type: "blob" })
  
  // Trigger download
  const url = window.URL.createObjectURL(content)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
