import { withTenantRead } from "@/lib/dal/core"
/**
 * Parent Portal DAL
 */
import { prisma } from "@/lib/prisma"
import { withDAL } from "@/lib/dal/utils"
import { getParentContext } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "parent-portal" })

export async function getParentDashboard(): Promise<any> {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext()
  return withDAL(
    "parentPortal.dashboard",
    () =>
      prisma.parent.findUnique({
        where: { id: parentId },
        include: {
          students: {
            where: { schoolId, isActive: true },
            select: {
              id: true,
              name: true,
              class: true,
              section: true,
              rollNumber: true,
              feeStatus: true,
              totalFees: true,
              paidAmount: true,
              pendingAmount: true,
              avatar: true,
              attendance: {
                where: { schoolId },
                orderBy: { date: "desc" },
                take: 30,
                select: { date: true, status: true },
              },
              results: {
                where: { schoolId },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: { grade: true, marks: true, createdAt: true, exam: { select: { name: true, maxMarks: true } } },
              },
              payments: {
                where: { schoolId },
                orderBy: { date: "desc" },
                take: 5,
                select: { amount: true, feeType: true, date: true, status: true, receiptNumber: true },
              },
            },
          },
        },
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
  })
}

async function assertChildOwnership(studentId: string, schoolId: string, parentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { schoolId: true, parentId: true },
  })
  if (!student || student.schoolId !== schoolId || student.parentId !== parentId) {
    throw new Error("Student not found or not linked to this parent")
  }
}

export async function getChildAttendance(studentId: string, opts?: { limit?: number }): Promise<any> {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext()
  await assertChildOwnership(studentId, schoolId, parentId)
  const { limit = 60 } = opts ?? {}
  return withDAL(
    "parentPortal.childAttendance",
    () =>
      prisma.attendance.findMany({
        where: { studentId, schoolId },
        orderBy: { date: "desc" },
        take: limit,
        select: { date: true, status: true, remarks: true },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
  })
}

export async function getChildPayments(studentId: string): Promise<any> {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext()
  await assertChildOwnership(studentId, schoolId, parentId)
  return withDAL(
    "parentPortal.childPayments",
    () =>
      prisma.payment.findMany({
        where: { studentId, schoolId },
        orderBy: { date: "desc" },
        select: { id: true, amount: true, feeType: true, paymentMethod: true, date: true, status: true, receiptNumber: true, remarks: true },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
  })
}

export async function getChildInvoices(studentId: string): Promise<any> {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext()
  await assertChildOwnership(studentId, schoolId, parentId)
  return withDAL(
    "parentPortal.childInvoices",
    () =>
      prisma.invoice.findMany({
        where: { studentId, schoolId },
        orderBy: { createdAt: "desc" },
        select: { id: true, invoiceNo: true, lineItems: true, subtotal: true, cgstRate: true, cgstAmount: true, sgstRate: true, sgstAmount: true, igstRate: true, igstAmount: true, discountAmount: true, discountReason: true, total: true, dueDate: true, paidAt: true, status: true, notes: true, createdAt: true },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
  })
}

export async function getSchoolAnnouncements(): Promise<any> {
  return withTenantRead(async () => {
    const { schoolId } = await getParentContext()
  return withDAL(
    "parentPortal.announcements",
    () =>
      prisma.announcement.findMany({
        where: { schoolId, isActive: true, targetAudience: { in: ["ALL", "PARENTS"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
  })
}

export async function getStudentProfile(studentId: string): Promise<any> {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext()
    await assertChildOwnership(studentId, schoolId, parentId)

    return withDAL(
      "parentPortal.studentProfile",
      () =>
        prisma.student.findUnique({
          where: { id: studentId },
          select: {
            id: true,
            name: true,
            class: true,
            section: true,
            rollNumber: true,
            gender: true,
            dateOfBirth: true,
            avatar: true,
            feeStatus: true,
            totalFees: true,
            paidAmount: true,
            pendingAmount: true,
            parent: {
              select: { id: true, name: true, relationship: true }
            },
            enrollments: { where: { status: 'ACTIVE' },
              include: { batch: { include: { session: true } } }
            },
            attendance: {
              where: { schoolId },
              orderBy: { date: "desc" },
              take: 30,
              select: { status: true, date: true }
            }
          },
        }),
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}

export async function getStudentTimeline(studentId: string): Promise<any> {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext()
    await assertChildOwnership(studentId, schoolId, parentId)

    return withDAL(
      "parentPortal.studentTimeline",
      async () => {
        const [attendance, results, payments, announcements] = await Promise.all([
          prisma.attendance.findMany({
            where: { studentId, schoolId },
            orderBy: { date: "desc" },
            take: 20,
            select: { date: true, status: true, id: true }
          }),
          prisma.result.findMany({
            where: { studentId, schoolId },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { createdAt: true, grade: true, id: true, exam: { select: { name: true } } }
          }),
          prisma.payment.findMany({
            where: { studentId, schoolId },
            orderBy: { date: "desc" },
            take: 10,
            select: { date: true, amount: true, feeType: true, id: true }
          }),
          prisma.announcement.findMany({
            where: { schoolId, isActive: true, targetAudience: { in: ["ALL", "PARENTS"] } },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { createdAt: true, title: true, id: true }
          })
        ]);

        const timeline: any[] = [];
        
        attendance.forEach(a => timeline.push({
          id: `att-${a.id}`,
          type: "ATTENDANCE_MARKED",
          date: a.date,
          title: `Attendance Marked: ${a.status}`,
          meta: { status: a.status }
        }));

        results.forEach(r => timeline.push({
          id: `res-${r.id}`,
          type: "RESULT_PUBLISHED",
          date: r.createdAt,
          title: `Result Published: ${r.exam.name}`,
          meta: { grade: r.grade }
        }));

        payments.forEach(p => timeline.push({
          id: `pay-${p.id}`,
          type: "PAYMENT_RECEIVED",
          date: p.date,
          title: `Payment Received: ₹${p.amount}`,
          meta: { amount: p.amount, feeType: p.feeType }
        }));

        announcements.forEach(a => timeline.push({
          id: `ann-${a.id}`,
          type: "ANNOUNCEMENT_POSTED",
          date: a.createdAt,
          title: a.title,
          meta: {}
        }));

        timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return timeline.slice(0, 50);
      },
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
    )
  })
}

export async function getChildResults(studentId: string): Promise<any> {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext()
    await assertChildOwnership(studentId, schoolId, parentId)
    return withDAL(
      "parentPortal.childResults",
      () =>
        prisma.result.findMany({
          where: { studentId, schoolId },
          orderBy: { createdAt: "desc" },
          include: {
            exam: { select: { name: true, subject: true, date: true, maxMarks: true, examGroup: { select: { name: true, session: { select: { name: true } } } } } },
          },
        }),
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}
