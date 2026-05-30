import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";
import { auth } from "@/lib/auth";
import { getSchoolId } from "@/lib/tenant-context";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const schoolId = await getSchoolId();
    if (!schoolId) {
      return new NextResponse("No active school", { status: 400 });
    }

    const { id: paymentId } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: true,
        school: true
      }
    });

    if (!payment || payment.schoolId !== schoolId) {
      return new NextResponse("Payment not found", { status: 404 });
    }

    if (session.user.role === "PARENT") {
      const parent = await prisma.parent.findFirst({
        where: { userId: session.user.id, schoolId }
      });
      if (!parent || payment.student.parentId !== parent.id) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    // Generate PDF using jsPDF
    const doc = new jsPDF("landscape", "pt", "a4");
    
    // Header
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(payment.school.name, 40, 50);

    doc.setFontSize(16);
    doc.text("GST TAX INVOICE / RECEIPT", 600, 50);

    // Separator
    doc.setLineWidth(1);
    doc.line(40, 70, 800, 70);

    // School Details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`GSTIN: ${payment.school.gstin || "Applied For"}`, 40, 90);
    doc.text(`SAC: 998314`, 40, 105);

    // Receipt details
    doc.setFont("helvetica", "bold");
    doc.text("Receipt No:", 40, 140);
    doc.setFont("helvetica", "normal");
    doc.text(payment.receiptNumber || payment.id.slice(0, 8), 120, 140);

    doc.setFont("helvetica", "bold");
    doc.text("Date:", 40, 160);
    doc.setFont("helvetica", "normal");
    const formattedDate = new Date(payment.date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    doc.text(formattedDate, 120, 160);

    doc.setFont("helvetica", "bold");
    doc.text("Student:", 40, 180);
    doc.setFont("helvetica", "normal");
    doc.text(payment.student.name, 120, 180);

    doc.setFont("helvetica", "bold");
    doc.text("Class:", 40, 200);
    doc.setFont("helvetica", "normal");
    doc.text(payment.student.class + (payment.student.section ? ` - ${payment.student.section}` : ""), 120, 200);

    // Right side details
    const rightX = 500;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Amount Paid", rightX, 140);
    
    doc.setFontSize(20);
    doc.setTextColor(0, 128, 0); // Green color
    doc.text(`INR ${payment.amount.toLocaleString("en-IN")}`, rightX, 165);
    doc.setTextColor(0, 0, 0); // Reset color
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Method:", rightX, 190);
    doc.setFont("helvetica", "normal");
    doc.text(payment.paymentMethod, rightX + 100, 190);

    if (payment.transactionId) {
      doc.setFont("helvetica", "bold");
      doc.text("Transaction ID:", rightX, 210);
      doc.setFont("helvetica", "normal");
      doc.text(payment.transactionId, rightX + 100, 210);
    }

    // Fee Type
    doc.setFont("helvetica", "bold");
    doc.text("Fee Description:", 40, 240);
    doc.setFont("helvetica", "normal");
    doc.text(payment.feeType, 130, 240);

    // GST Breakdown
    doc.setFont("helvetica", "bold");
    doc.text("Tax Breakdown:", 40, 270);
    doc.setFont("helvetica", "normal");
    const baseAmount = payment.amount / 1.18; // Assuming amount includes 18% GST
    const cgst = baseAmount * 0.09;
    const sgst = baseAmount * 0.09;

    doc.text(`Base Amount: INR ${baseAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, 40, 290);
    doc.text(`CGST (9%): INR ${cgst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, 40, 305);
    doc.text(`SGST (9%): INR ${sgst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, 40, 320);

    // Footer
    doc.setLineWidth(1);
    doc.line(40, 500, 800, 500);

    doc.text("Thank you for your payment. This is a computer-generated invoice.", 40, 520);

    const pdfBytes = doc.output("arraybuffer");

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt_${payment.receiptNumber || payment.id}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Failed to generate receipt:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
