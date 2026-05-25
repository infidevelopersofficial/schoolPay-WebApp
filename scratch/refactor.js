const fs = require("fs");

let content = fs.readFileSync("lib/dal/parent-portal.ts", "utf-8");

// We need to add getStudentProfile and getStudentTimeline.
const newFunctions = `
export async function getStudentProfile(studentId: string) {
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
              select: {
                id: true,
                name: true,
                relationship: true,
              }
            },
            enrollments: {
              where: { isActive: true },
              include: {
                batch: {
                  include: { academicYear: true }
                }
              }
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

export async function getStudentTimeline(studentId: string) {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext()
    await assertChildOwnership(studentId, schoolId, parentId)

    return withDAL(
      "parentPortal.studentTimeline",
      async () => {
        // Fetch different events and merge them in JS
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
          id: \`att-\${a.id}\`,
          type: "ATTENDANCE_MARKED",
          date: a.date,
          title: \`Attendance Marked: \${a.status}\`,
          meta: { status: a.status }
        }));

        results.forEach(r => timeline.push({
          id: \`res-\${r.id}\`,
          type: "RESULT_PUBLISHED",
          date: r.createdAt,
          title: \`Result Published: \${r.exam.name}\`,
          meta: { grade: r.grade }
        }));

        payments.forEach(p => timeline.push({
          id: \`pay-\${p.id}\`,
          type: "PAYMENT_RECEIVED",
          date: p.date,
          title: \`Payment Received: ₹\${p.amount}\`,
          meta: { amount: p.amount, feeType: p.feeType }
        }));

        announcements.forEach(a => timeline.push({
          id: \`ann-\${a.id}\`,
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
`;

content += "\n" + newFunctions;

content = content.replace(
  /export async function getChildResults\(studentId: string\) \{([\s\S]*?)prisma\.result\.findMany\(\{([\s\S]*?)include: \{([\s\S]*?)exam: \{ select: \{ name: true, subject: true, batch: \{ select: \{ grade: true, section: true \} \}, date: true \} \},([\s\S]*?)\},([\s\S]*?)\}\),([\s\S]*?)\}/,
  `export async function getChildResults(studentId: string) {
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
            exam: { select: { name: true, subject: true, date: true, examGroup: { select: { name: true, term: true, academicYear: { select: { name: true } } } } } },
          },
        }),
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}`
);

fs.writeFileSync("lib/dal/parent-portal.ts", content);
