import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
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

    // Generate PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header
    page.drawText(payment.school.name, {
      x: 50,
      y: height - 50,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("PAYMENT RECEIPT", {
      x: width - 200,
      y: height - 50,
      size: 16,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Separator
    page.drawLine({
      start: { x: 50, y: height - 80 },
      end: { x: width - 50, y: height - 80 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Receipt details
    const startY = height - 120;
    const leftX = 50;
    const rightX = 300;

    const drawLabelValue = (label: string, value: string, yOffset: number) => {
      page.drawText(label, { x: leftX, y: startY - yOffset, size: 10, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(value, { x: leftX + 100, y: startY - yOffset, size: 12, font, color: rgb(0, 0, 0) });
    };

    drawLabelValue("Receipt No:", payment.receiptNumber || payment.id.slice(0, 8), 0);
    drawLabelValue("Date:", new Date(payment.date).toLocaleDateString(), 20);
    drawLabelValue("Student:", payment.student.name, 40);
    drawLabelValue("Class:", payment.student.class + (payment.student.section ? ` - ${payment.student.section}` : ""), 60);

    // Right side details
    page.drawText("Amount Paid", { x: rightX, y: startY, size: 10, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`${payment.school.currency || "INR"} ${payment.amount.toLocaleString()}`, { 
      x: rightX, 
      y: startY - 25, 
      size: 20, 
      font: boldFont, 
      color: rgb(0, 0.5, 0) 
    });

    page.drawText("Payment Method:", { x: rightX, y: startY - 50, size: 10, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(payment.paymentMethod, { x: rightX + 100, y: startY - 50, size: 10, font, color: rgb(0, 0, 0) });

    if (payment.transactionId) {
      page.drawText("Transaction ID:", { x: rightX, y: startY - 70, size: 10, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(payment.transactionId, { x: rightX + 100, y: startY - 70, size: 10, font, color: rgb(0, 0, 0) });
    }

    // Fee Type
    page.drawText("Fee Description:", { x: leftX, y: startY - 100, size: 10, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(payment.feeType, { x: leftX + 100, y: startY - 100, size: 12, font, color: rgb(0, 0, 0) });

    // Footer
    page.drawLine({
      start: { x: 50, y: 50 },
      end: { x: width - 50, y: 50 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("Thank you for your payment.", {
      x: 50,
      y: 30,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
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
