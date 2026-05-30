"use server";

import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function getFeeCollectionReport() {
  const { schoolId } = await getTenantContext();
  
  const payments = await db.payment.findMany({
    where: { schoolId, status: "COMPLETED" },
    include: { student: true },
    orderBy: { date: "desc" }
  });

  return payments.map((p: any) => ({
    receiptNumber: p.receiptNumber || "-",
    studentName: p.student.name,
    admissionNumber: p.student.admissionNumber || "-",
    date: formatDate(p.date),
    feeType: p.feeType,
    paymentMethod: p.paymentMethod,
    amount: formatCurrency(p.amount)
  }));
}

export async function getOutstandingFeesReport() {
  const { schoolId } = await getTenantContext();
  
  const students = await db.student.findMany({
    where: { schoolId, pendingAmount: { gt: 0 } },
    orderBy: { name: "asc" }
  });

  return students.map((s: any) => ({
    studentName: s.name,
    admissionNumber: s.admissionNumber || "-",
    class: s.class,
    phone: s.phone || "-",
    totalFees: formatCurrency(s.totalFees),
    paidAmount: formatCurrency(s.paidAmount),
    pendingAmount: formatCurrency(s.pendingAmount)
  }));
}
