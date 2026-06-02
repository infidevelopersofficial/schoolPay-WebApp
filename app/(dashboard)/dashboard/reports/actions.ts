"use server";

import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function getFeeCollectionReport(startDate?: Date, endDate?: Date) {
  const { schoolId } = await getTenantContext();
  
  const whereClause: any = { schoolId, status: "COMPLETED" };
  
  if (startDate && endDate) {
    // Set to start of day and end of day
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    whereClause.date = {
      gte: start,
      lte: end
    };
  }
  
  const payments = await db.payment.findMany({
    where: whereClause,
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

export async function getDailySettlementReport(startDate?: Date, endDate?: Date) {
  const { schoolId } = await getTenantContext();
  
  const whereClause: any = { schoolId, status: "COMPLETED" };
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    whereClause.date = { gte: start, lte: end };
  }
  
  const payments = await db.payment.findMany({
    where: whereClause,
    select: { paymentMethod: true, amount: true }
  });

  const summary = payments.reduce((acc: any, payment) => {
    const method = payment.paymentMethod || "UNKNOWN";
    if (!acc[method]) {
      acc[method] = { count: 0, total: 0 };
    }
    acc[method].count += 1;
    acc[method].total += payment.amount;
    return acc;
  }, {});

  const rows = Object.keys(summary).map(method => ({
    paymentMethod: method,
    transactionCount: summary[method].count,
    totalAmount: formatCurrency(summary[method].total)
  }));

  // Add a total row
  const grandTotal = Object.values(summary).reduce((sum: number, s: any) => sum + s.total, 0);
  const grandCount = Object.values(summary).reduce((sum: number, s: any) => sum + s.count, 0);
  
  rows.push({
    paymentMethod: "TOTAL",
    transactionCount: grandCount,
    totalAmount: formatCurrency(grandTotal)
  });

  return rows;
}

export async function getAttendanceSummaryReport(startDate?: Date, endDate?: Date) {
  const { schoolId } = await getTenantContext();
  
  const whereClause: any = { schoolId };
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    whereClause.date = { gte: start, lte: end };
  }
  
  const records = await db.attendance.findMany({
    where: whereClause,
    include: { student: true }
  });

  const summary = records.reduce((acc: any, record) => {
    const studentId = record.studentId;
    if (!acc[studentId]) {
      acc[studentId] = {
        studentName: record.student.name,
        admissionNumber: record.student.admissionNumber || "-",
        class: record.student.class,
        present: 0,
        absent: 0,
        late: 0,
        halfDay: 0,
        holiday: 0
      };
    }
    
    if (record.status === "PRESENT") acc[studentId].present += 1;
    else if (record.status === "ABSENT") acc[studentId].absent += 1;
    else if (record.status === "LATE") acc[studentId].late += 1;
    else if (record.status === "HALF_DAY") acc[studentId].halfDay += 1;
    else if (record.status === "HOLIDAY") acc[studentId].holiday += 1;
    
    return acc;
  }, {});

  return Object.values(summary).map((s: any) => ({
    studentName: s.studentName,
    admissionNumber: s.admissionNumber,
    class: s.class,
    presentDays: s.present,
    absentDays: s.absent,
    lateDays: s.late,
    totalWorkingDays: s.present + s.absent + s.late + s.halfDay
  })).sort((a: any, b: any) => a.class.localeCompare(b.class) || a.studentName.localeCompare(b.studentName));
}

