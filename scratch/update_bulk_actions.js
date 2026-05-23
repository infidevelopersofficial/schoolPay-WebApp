const fs = require('fs');

let actions = fs.readFileSync('app/(dashboard)/students/portal-actions.ts', 'utf8');

const bulkExportAction = `
export const bulkGenerateStudentCredentials = withTenantAuth(["ADMIN", "SUPER_ADMIN"])(
  async ({ schoolId, userId }, studentIds: string[]) => {
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds }, schoolId }
    });

    let csvContent = "Student Name,Admission Number,School Code,Temporary Password\\n";

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new Error("School not found");

    for (const student of students) {
      const rawPassword = generateStrongPassword();
      const tempPasswordHash = await bcrypt.hash(rawPassword, 10);
      const tempPasswordExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.student.update({
        where: { id: student.id },
        data: {
          tempPasswordHash,
          tempPasswordExpiresAt,
          portalAccessEnabled: true,
          accountStatus: "PENDING_ACTIVATION",
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });

      csvContent += \`"\${student.name}","\${student.admissionNumber || ''}","\${school.slug}","\${rawPassword}"\\n\`;
    }

    await prisma.auditLog.create({
      data: {
        action: "STUDENT_CREDENTIAL_EXPORTED",
        entityType: "Student_Bulk",
        entityId: \`\${students.length} students\`,
        schoolId,
        userId
      }
    });

    revalidatePath("/students");
    return csvContent;
  }
);
`;

actions += bulkExportAction;
fs.writeFileSync('app/(dashboard)/students/portal-actions.ts', actions);
console.log("Added bulk export action");
