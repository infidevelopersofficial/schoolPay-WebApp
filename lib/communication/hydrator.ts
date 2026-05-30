import { prisma } from "@/lib/prisma";

/**
 * Dynamically replaces personalization placeholders in message contents.
 * Fallbacks to empty strings gracefully if parameters or entities are missing.
 */
export async function hydrateTemplate(
  rawContent: string,
  studentId: string | null,
  schoolId: string
): Promise<string> {
  let content = rawContent;

  let studentName = "";
  let parentName = "";
  let schoolName = "";
  let className = "";
  let batchName = "";
  let amountDue = "";
  let dueDate = "";

  try {
    // 1. Resolve school metadata
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    });
    if (school) schoolName = school.name;

    // 2. Resolve student metadata if target is set
    if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          parent: true,
          enrollments: {
            where: { status: "ACTIVE" },
            include: { batch: true },
          },
          invoices: {
            where: { status: { in: ["SENT", "OVERDUE"] } },
            orderBy: { dueDate: "asc" },
          },
        },
      });

      if (student) {
        studentName = student.name;
        className = student.class;
        if (student.parent) {
          parentName = student.parent.name;
        }
        if (student.enrollments[0]?.batch) {
          batchName = student.enrollments[0].batch.name;
        }

        // Fetch unpaid invoice balance summaries
        if (student.invoices.length > 0) {
          const totalUnpaid = student.invoices.reduce((sum, inv) => sum + inv.total, 0);
          amountDue = `₹${totalUnpaid.toFixed(2)}`;

          const earliestDue = student.invoices[0].dueDate;
          dueDate = new Date(earliestDue).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        }
      }
    }
  } catch (err) {
    console.error("[Template Hydration] Failed to fetch personalization values:", err);
  }

  // Global regex replacement over key personalization values
  return content
    .replace(/\{\{studentName\}\}/g, studentName)
    .replace(/\{\{parentName\}\}/g, parentName)
    .replace(/\{\{schoolName\}\}/g, schoolName)
    .replace(/\{\{className\}\}/g, className)
    .replace(/\{\{batchName\}\}/g, batchName)
    .replace(/\{\{amountDue\}\}/g, amountDue)
    .replace(/\{\{dueDate\}\}/g, dueDate);
}
