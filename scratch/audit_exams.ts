import { prisma, tenantContext } from "../lib/prisma";

async function main() {
  await tenantContext.run({ schoolId: "" }, async () => {
    const examCount = await prisma.exam.count();
    const resultCount = await prisma.result.count();
    
    const exams = await prisma.exam.findMany({ select: { class: true, subject: true } });
    const distinctClasses = [...new Set(exams.map((e: any) => e.class))];
    const distinctSubjects = [...new Set(exams.map((e: any) => e.subject))];
    
    console.log('Exams:', examCount);
    console.log('Results:', resultCount);
    console.log('Classes:', distinctClasses);
    console.log('Subjects:', distinctSubjects);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
