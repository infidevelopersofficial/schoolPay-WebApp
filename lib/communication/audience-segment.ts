import { prisma } from "@/lib/prisma";

export interface AudienceFilter {
  segmentType:
    | "ENTIRE_SCHOOL"
    | "CLASS"
    | "BATCH"
    | "SECTION"
    | "PARENTS_ONLY"
    | "FEE_DEFAULTERS"
    | "ATTENDANCE_RISK"
    | "PERFORMANCE_RISK"
    | "ADMISSION_RANGE";
  classValue?: string;
  batchId?: string;
  sectionValue?: string;
  attendanceThreshold?: number;
  performanceThreshold?: number;
  admissionDateFrom?: string;
  admissionDateTo?: string;
  targetAudience?: "STUDENTS" | "PARENTS" | "ALL";
}

export interface ResolvedRecipient {
  userId: string;
  studentId: string | null;
  parentUserId: string | null;
  schoolId: string;
}

/**
 * Resolves complex segmentation criteria into a deduplicated list of target User IDs.
 * Scoped strictly to the school's tenant boundary.
 */
export async function resolveAudienceFilters(
  schoolId: string,
  filter: AudienceFilter
): Promise<ResolvedRecipient[]> {
  const segmentType = filter.segmentType;
  const targetAudience = filter.targetAudience || "ALL";

  let students: any[] = [];

  switch (segmentType) {
    case "ENTIRE_SCHOOL": {
      students = await prisma.student.findMany({
        where: { schoolId, isActive: true },
        include: { parent: true },
      });
      break;
    }
    case "CLASS": {
      if (!filter.classValue) break;
      students = await prisma.student.findMany({
        where: { schoolId, class: filter.classValue, isActive: true },
        include: { parent: true },
      });
      break;
    }
    case "BATCH": {
      if (!filter.batchId) break;
      const enrollments = await prisma.enrollment.findMany({
        where: {
          schoolId,
          batchId: filter.batchId,
          status: "ACTIVE",
          student: { isActive: true },
        },
        include: {
          student: {
            include: { parent: true },
          },
        },
      });
      students = enrollments.map((e) => e.student);
      break;
    }
    case "SECTION": {
      if (!filter.sectionValue) break;
      students = await prisma.student.findMany({
        where: { schoolId, section: filter.sectionValue, isActive: true },
        include: { parent: true },
      });
      break;
    }
    case "PARENTS_ONLY": {
      students = await prisma.student.findMany({
        where: { schoolId, isActive: true },
        include: { parent: true },
      });
      break;
    }
    case "FEE_DEFAULTERS": {
      // Find students with overdue or unpaid past-due invoices
      const delinquentInvoices = await prisma.invoice.findMany({
        where: {
          schoolId,
          status: { in: ["SENT", "OVERDUE"] },
          dueDate: { lt: new Date() },
        },
        select: { studentId: true },
      });
      const studentIds = Array.from(new Set(delinquentInvoices.map((i) => i.studentId)));

      students = await prisma.student.findMany({
        where: { id: { in: studentIds }, schoolId, isActive: true },
        include: { parent: true },
      });
      break;
    }
    case "ATTENDANCE_RISK": {
      const threshold = filter.attendanceThreshold ?? 75;
      const activeStudents = await prisma.student.findMany({
        where: { schoolId, isActive: true },
        include: { parent: true, attendance: true },
      });

      // Filter students with low attendance
      students = activeStudents.filter((student) => {
        const logs = student.attendance;
        if (logs.length === 0) return false;

        const activeDays = logs.filter(
          (l) => l.status !== "HOLIDAY" && l.status !== "NOT_MARKED"
        );
        if (activeDays.length === 0) return false;

        const presentDays = activeDays.filter(
          (l) => l.status === "PRESENT" || l.status === "LATE"
        ).length;
        const halfDays = activeDays.filter((l) => l.status === "HALF_DAY").length;

        const percentage = ((presentDays + halfDays * 0.5) / activeDays.length) * 100;
        return percentage < threshold;
      });
      break;
    }
    case "PERFORMANCE_RISK": {
      const threshold = filter.performanceThreshold ?? 40;
      const activeStudents = await prisma.student.findMany({
        where: { schoolId, isActive: true },
        include: { parent: true, results: { where: { status: "PUBLISHED" }, include: { exam: true } } },
      });

      // Filter students with low average performance
      students = activeStudents.filter((student) => {
        const publishedResults = student.results.filter(r => r.marks !== null && r.exam?.maxMarks);
        if (publishedResults.length === 0) return false;

        let totalObtained = 0;
        let totalMax = 0;
        for (const res of publishedResults) {
          if (res.marks !== null && res.exam?.maxMarks) {
            totalObtained += res.marks;
            totalMax += res.exam.maxMarks;
          }
        }
        if (totalMax === 0) return false;

        const average = (totalObtained / totalMax) * 100;
        return average < threshold;
      });
      break;
    }
    case "ADMISSION_RANGE": {
      if (!filter.admissionDateFrom || !filter.admissionDateTo) break;
      students = await prisma.student.findMany({
        where: {
          schoolId,
          isActive: true,
          admissionDate: {
            gte: new Date(filter.admissionDateFrom),
            lte: new Date(filter.admissionDateTo),
          },
        },
        include: { parent: true },
      });
      break;
    }
  }

  // Deduplicate and map target recipients to standard payload mapping
  const recipientsMap = new Map<string, ResolvedRecipient>();

  for (const student of students) {
    // 1. Resolve Student Targets
    if (targetAudience === "STUDENTS" || targetAudience === "ALL") {
      if (student.userId) {
        recipientsMap.set(student.userId, {
          userId: student.userId,
          studentId: student.id,
          parentUserId: null,
          schoolId,
        });
      }
    }

    // 2. Resolve Parent Targets
    if (segmentType === "PARENTS_ONLY" || targetAudience === "PARENTS" || targetAudience === "ALL") {
      let parentUserId = student.parent?.userId || null;
      if (!parentUserId && student.parent?.email) {
        const matchingUser = await prisma.user.findUnique({
          where: { email: student.parent.email },
          select: { id: true },
        });
        parentUserId = matchingUser?.id || null;
      }

      if (parentUserId) {
        recipientsMap.set(parentUserId, {
          userId: parentUserId,
          studentId: student.id,
          parentUserId,
          schoolId,
        });
      }
    }
  }

  return Array.from(recipientsMap.values());
}
