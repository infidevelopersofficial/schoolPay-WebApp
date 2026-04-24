/**
 * Parent Portal DAL
 *
 * All functions here enforce that the caller has PARENT role by using
 * getParentContext(), which throws if the session is not a parent.
 *
 * Data access is doubly scoped:
 * 1. schoolId — tenant isolation
 * 2. parentId — parent can only see their own children's data
 */

import { prisma } from "@/lib/prisma"
import { withDAL } from "@/lib/dal/utils"
import { getParentContext } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "parent-portal" })

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────

/**
 * Returns the parent record with all linked children and a summary of
 * each child's fee status and recent attendance.
 */
export async function getParentDashboard() {
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
                select: { examName: true, grade: true, percentage: true, marks: true, maxMarks: true, createdAt: true },
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
}

// ──────────────────────────────────────────────
// Child-specific queries
// ──────────────────────────────────────────────

async function assertChildOwnership(studentId: string, schoolId: string, parentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { schoolId: true, parentId: true },
  })
  if (!student || student.schoolId !== schoolId || student.parentId !== parentId) {
    throw new Error("Student not found or not linked to this parent")
  }
}

export async function getChildAttendance(studentId: string, opts?: { limit?: number }) {
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
        select: {
          date: true,
          status: true,
          remarks: true,
        },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function getChildResults(studentId: string) {
  const { schoolId, parentId } = await getParentContext()
  await assertChildOwnership(studentId, schoolId, parentId)
  return withDAL(
    "parentPortal.childResults",
    () =>
      prisma.result.findMany({
        where: { studentId, schoolId },
        orderBy: { createdAt: "desc" },
        include: {
          exam: { select: { name: true, subject: true, class: true, date: true } },
        },
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

export async function getChildPayments(studentId: string) {
  const { schoolId, parentId } = await getParentContext()
  await assertChildOwnership(studentId, schoolId, parentId)
  return withDAL(
    "parentPortal.childPayments",
    () =>
      prisma.payment.findMany({
        where: { studentId, schoolId },
        orderBy: { date: "desc" },
        select: {
          id: true,
          amount: true,
          feeType: true,
          paymentMethod: true,
          date: true,
          status: true,
          receiptNumber: true,
          remarks: true,
        },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function getChildInvoices(studentId: string) {
  const { schoolId, parentId } = await getParentContext()
  await assertChildOwnership(studentId, schoolId, parentId)
  return withDAL(
    "parentPortal.childInvoices",
    () =>
      prisma.invoice.findMany({
        where: { studentId, schoolId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNo: true,
          lineItems: true,
          subtotal: true,
          taxRate: true,
          taxAmount: true,
          total: true,
          dueDate: true,
          paidAt: true,
          status: true,
          notes: true,
          createdAt: true,
        },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function getSchoolAnnouncements() {
  const { schoolId } = await getParentContext()
  return withDAL(
    "parentPortal.announcements",
    () =>
      prisma.announcement.findMany({
        where: {
          schoolId,
          isActive: true,
          targetAudience: { in: ["ALL", "PARENTS"] },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
