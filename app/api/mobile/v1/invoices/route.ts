import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/mobile/auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { InvoiceDTO } from "@/lib/mobile/dto";

export async function GET(request: Request) {
  try {
    const session = await requireMobileAuth();

    // Rate Limiting
    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Fetch all students for this parent
    const students = await prisma.student.findMany({
      where: {
        parentId: session.parentId,
        schoolId: session.schoolId,
      },
      select: { id: true },
    });
    const studentIds = students.map((s) => s.id);

    if (studentIds.length === 0) {
      return NextResponse.json({ pendingInvoices: [], paidInvoices: [], totalOutstanding: 0 });
    }

    // Fetch invoices
    const invoicesData = await prisma.invoice.findMany({
      where: {
        studentId: { in: studentIds },
        schoolId: session.schoolId,
      },
      orderBy: { dueDate: "desc" },
    });

    const pendingInvoices: InvoiceDTO[] = [];
    const paidInvoices: InvoiceDTO[] = [];
    let totalOutstanding = 0;

    invoicesData.forEach((inv) => {
      const dto: InvoiceDTO = {
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        title: inv.title,
        total: inv.total,
        dueDate: inv.dueDate.toISOString(),
        status: inv.status,
        paidAt: inv.paidAt?.toISOString() || null,
        studentId: inv.studentId,
      };

      if (inv.status === "PAID") {
        paidInvoices.push(dto);
      } else if (inv.status === "SENT" || inv.status === "OVERDUE") {
        pendingInvoices.push(dto);
        totalOutstanding += inv.total;
      }
    });

    return NextResponse.json({
      pendingInvoices,
      paidInvoices,
      totalOutstanding,
    });
  } catch (error: any) {
    if (error.name === "MobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Mobile Invoices API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
