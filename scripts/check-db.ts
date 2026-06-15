import 'dotenv/config';
import { prisma } from '../lib/prisma';



async function main() {
  console.log("--- INVENTORY ---");
  const exams = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "Exam"`);
  console.log(`Exam Records: ${exams.length}`);
  
  const results = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "Result"`);
  console.log(`Result Records: ${results.length}`);
  
  const batches = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "Batch"`);
  console.log(`Batch Records: ${batches.length}`);
  
  const subjects = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "Subject"`);
  console.log(`Subject Records: ${subjects.length}`);
  
  const sessions = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "AcademicSession"`);
  console.log(`Session Records: ${sessions.length}`);

  console.log("\n--- TRANSFORMATION VALIDATION ---");
  // Check Exam.class -> Batch.id
  let classMatched = 0;
  let classUnmatched = 0;
  
  for (const exam of exams) {
    // If the database has NOT migrated, it will have exam.class. 
    // If it HAS migrated, it won't. Let's see what the raw query returns.
    if (exam.class) {
       const batchMatch = batches.find(b => b.name === exam.class && b.schoolId === exam.schoolId);
       if (batchMatch) classMatched++;
       else classUnmatched++;
    }
  }

  console.log(`Batch Mapping: Matched=${classMatched}, Unmatched=${classUnmatched}`);

  let subjectMatched = 0;
  let subjectUnmatched = 0;
  for (const exam of exams) {
    if (exam.subject) {
      const subjectMatch = subjects.find(s => s.name === exam.subject && s.schoolId === exam.schoolId);
      if (subjectMatch) subjectMatched++;
      else subjectUnmatched++;
    }
  }
  console.log(`Subject Mapping: Matched=${subjectMatched}, Unmatched=${subjectUnmatched}`);

  let examNameMatched = 0;
  let examNameUnmatched = 0;
  for (const result of results) {
    if (result.examName) {
      const examMatch = exams.find(e => e.name === result.examName && e.schoolId === result.schoolId);
      if (examMatch) examNameMatched++;
      else examNameUnmatched++;
    }
  }
  console.log(`Result Exam Mapping: Matched=${examNameMatched}, Unmatched=${examNameUnmatched}`);

}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
