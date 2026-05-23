import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Validates the session and returns the secure student context.
 * Throws an error if the user is unauthenticated, lacks a student role, or lacks required IDs.
 */
async function getStudentContext() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized: No session")
  }

  if (session.user.schoolRole !== "STUDENT") {
    throw new Error("Unauthorized: Insufficient permissions. Role STUDENT required.")
  }

  const studentId = session.user.studentId
  const schoolId = session.user.activeSchoolId

  if (!studentId || !schoolId) {
    throw new Error("Unauthorized: Missing student or school identity")
  }

  return { studentId, schoolId }
}

export async function getMyProfile() {
  const { studentId, schoolId } = await getStudentContext()

  const profile = await prisma.student.findUnique({
    where: {
      id: studentId,
      schoolId: schoolId,
    },
    include: {
      school: {
        select: {
          name: true,
          slug: true,
          logo: true,
        }
      },
      parent: {
        select: {
          name: true,
          phone: true,
          email: true,
        }
      },
      enrollments: {
        where: {
          status: "ACTIVE"
        },
        include: {
          batch: true
        }
      }
    }
  })

  if (!profile) throw new Error("Student profile not found")

  return profile
}

export async function getMyAttendance(limit?: number) {
  const { studentId, schoolId } = await getStudentContext()

  return prisma.attendance.findMany({
    where: {
      studentId,
      schoolId,
    },
    orderBy: {
      date: 'desc'
    },
    ...(limit && { take: limit }),
    include: {
      batch: {
        select: { name: true }
      }
    }
  })
}

export async function getMyResults(limit?: number) {
  const { studentId, schoolId } = await getStudentContext()

  return prisma.result.findMany({
    where: {
      studentId,
      schoolId,
      status: "PUBLISHED"
    },
    orderBy: {
      createdAt: 'desc'
    },
    ...(limit && { take: limit }),
    include: {
      exam: {
        select: {
          name: true,
          date: true,
        }
      }
    }
  })
}

export async function getMyFees() {
  const { studentId, schoolId } = await getStudentContext()

  return prisma.invoice.findMany({
    where: {
      studentId,
      schoolId,
      status: {
        notIn: ["CANCELLED", "DRAFT"]
      }
    },
    orderBy: {
      dueDate: 'asc'
    }
  })
}

export async function getMyPayments(limit?: number) {
  const { studentId, schoolId } = await getStudentContext()

  return prisma.payment.findMany({
    where: {
      studentId,
      schoolId,
    },
    orderBy: {
      date: 'desc'
    },
    ...(limit && { take: limit })
  })
}

export async function getMyAnnouncements(limit?: number) {
  const { schoolId } = await getStudentContext()

  return prisma.announcement.findMany({
    where: {
      schoolId,
      isActive: true,
      targetAudience: {
        in: ['ALL', 'STUDENTS']
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    ...(limit && { take: limit })
  })
}

export async function getMyDashboard() {
  const { studentId, schoolId } = await getStudentContext()

  // Pre-fetch basic student details needed for queries (like their class string for exams)
  const student = await prisma.student.findUnique({
    where: { id: studentId, schoolId },
    select: { class: true }
  })

  if (!student) {
    throw new Error("Student record not found")
  }

  // Execute all dashboard queries concurrently for maximum performance
  const [
    attendances,
    invoices,
    recentResults,
    upcomingExams,
    latestAnnouncements
  ] = await Promise.all([
    // 1. Attendance aggregation
    prisma.attendance.findMany({
      where: { studentId, schoolId },
      select: { status: true }
    }),
    // 2. Pending Invoices
    prisma.invoice.findMany({
      where: {
        studentId,
        schoolId,
        status: { in: ["SENT", "OVERDUE"] }
      },
      select: { total: true }
    }),
    // 3. Recent Results
    prisma.result.findMany({
      where: { studentId, schoolId, status: "PUBLISHED" },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { exam: { select: { name: true } } }
    }),
    // 4. Upcoming Exams
    prisma.exam.findMany({
      where: { 
        schoolId, 
        class: student.class, // matches student.class directly as per schema
        status: "SCHEDULED"
      },
      orderBy: { date: 'asc' },
      take: 3
    }),
    // 5. Latest Announcements
    prisma.announcement.findMany({
      where: { 
        schoolId, 
        isActive: true, 
        targetAudience: { in: ['ALL', 'STUDENTS'] } 
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    })
  ])

  // Calculate Aggregates
  const totalDays = attendances.length
  const presentDays = attendances.filter(a => a.status === "PRESENT" || a.status === "LATE").length
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100

  const pendingInvoicesCount = invoices.length
  const pendingFeesAmount = invoices.reduce((sum, inv) => sum + inv.total, 0)

  return {
    metrics: {
      attendancePercentage,
      totalDays,
      presentDays,
      pendingFeesAmount,
      pendingInvoicesCount,
      upcomingExamsCount: upcomingExams.length
    },
    recentResults,
    upcomingExams,
    latestAnnouncements
  }
}
