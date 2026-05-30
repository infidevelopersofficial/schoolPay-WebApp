import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/mobile/auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { PaymentDTO } from "@/lib/mobile/dto";

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
      return NextResponse.json({ payments: [], totalPaid: 0 });
    }

    // Fetch payments
    const paymentsData = await prisma.payment.findMany({
      where: {
        studentId: { in: studentIds },
        schoolId: session.schoolId,
        status: "COMPLETED",
      },
      orderBy: { date: "desc" },
    });

    const payments: PaymentDTO[] = paymentsData.map((p) => ({
      id: p.id,
      amount: p.amount,
      feeType: p.feeType,
      status: p.status,
      date: p.date.toISOString(),
      paymentMethod: p.paymentMethod,
      receiptNumber: p.receiptNumber,
      studentId: p.studentId,
    }));

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      payments,
      totalPaid,
    });
  } catch (error: any) {
    if (error.name === "MobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Mobile Payments API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
