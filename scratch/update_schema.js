const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Replace Exam model and Result model
const examRegex = /model Exam \{[\s\S]*?enum ResultStatus \{[\s\S]*?\}/;
const newExamAndResult = `
// ============================================
// Grading & Exams (Phase 6B)
// ============================================

model GradingScheme {
  id          String      @id @default(cuid())
  name        String      // e.g., "Standard High School 100-point"
  description String?
  schoolId    String
  school      School      @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  bands       GradeBand[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  examGroups  ExamGroup[] 
}

model GradeBand {
  id              String        @id @default(cuid())
  schemeId        String
  scheme          GradingScheme @relation(fields: [schemeId], references: [id], onDelete: Cascade)
  name            String        // e.g., "A+", "B"
  minMarks        Float         // e.g., 90.0
  maxMarks        Float         // e.g., 100.0
  points          Float?        // GPA equivalent e.g., 4.0
  remarksTemplate String?       // Default remarks for this band
}

model ExamGroup {
  id              String        @id @default(cuid())
  name            String        // e.g. "Term 1 Finals"
  schoolId        String
  school          School        @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  sessionId       String
  session         AcademicSession @relation(fields: [sessionId], references: [id])
  gradingSchemeId String?
  gradingScheme   GradingScheme?  @relation(fields: [gradingSchemeId], references: [id])
  
  exams           Exam[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([schoolId])
  @@index([sessionId])
}

model Exam {
  id              String      @id @default(cuid())
  name            String      
  examGroupId     String
  examGroup       ExamGroup   @relation(fields: [examGroupId], references: [id], onDelete: Cascade)
  
  batchId         String
  batch           Batch       @relation(fields: [batchId], references: [id])
  subjectId       String
  subject         Subject     @relation(fields: [subjectId], references: [id])
  sessionId       String
  session         AcademicSession @relation(fields: [sessionId], references: [id])

  date            String
  startTime       DateTime?
  endTime         DateTime?
  maxMarks        Float

  // Locking Controls
  marksLocked      Boolean    @default(false)
  resultsPublished Boolean    @default(false)
  
  venue           String?
  description     String?
  teacherId       String?
  teacher         Teacher?    @relation(fields: [teacherId], references: [id])
  schoolId        String
  school          School      @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  results         Result[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([batchId])
  @@index([subjectId])
  @@index([sessionId])
  @@index([schoolId])
}

enum ResultStatus {
  DRAFT
  PUBLISHED
  ABSENT
  EXEMPTED
}

model Result {
  id             String       @id @default(cuid())
  examId         String
  exam           Exam         @relation(fields: [examId], references: [id], onDelete: Cascade)
  studentId      String
  student        Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  sessionId      String
  session        AcademicSession @relation(fields: [sessionId], references: [id])
  
  status         ResultStatus @default(DRAFT)
  marks          Float?       // Nullable if Absent/Exempted
  grade          String?      // Derived from grading scheme
  remarks        String?

  schoolId       String
  school         School       @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  // Auditing metadata
  enteredById    String?      // User ID of the teacher who entered it
  
  modifications  GradeModificationLog[]

  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@unique([examId, studentId]) 
  @@index([schoolId])
  @@index([studentId])
}

model GradeModificationLog {
  id         String   @id @default(cuid())
  resultId   String
  result     Result   @relation(fields: [resultId], references: [id], onDelete: Cascade)
  
  oldMarks   Float?
  newMarks   Float?
  oldGrade   String?
  newGrade   String?
  
  reason     String
  changedById String   
  changedAt  DateTime @default(now())
}
`;

schema = schema.replace(examRegex, newExamAndResult.trim());

// School additions
if (!schema.includes('examGroups ExamGroup[]')) {
  schema = schema.replace('results       Result[]', 'results       Result[]\n  examGroups    ExamGroup[]\n  gradingSchemes GradingScheme[]');
}

// AcademicSession additions
if (!schema.includes('examGroups ExamGroup[]') && schema.includes('batches   Batch[]')) {
  schema = schema.replace('batches   Batch[]', 'batches   Batch[]\n  examGroups ExamGroup[]\n  exams      Exam[]\n  results    Result[]');
}

// Batch additions
if (!schema.includes('exams       Exam[]') && schema.includes('attendanceRegisters AttendanceRegister[]')) {
  schema = schema.replace('attendanceRegisters AttendanceRegister[]', 'attendanceRegisters AttendanceRegister[]\n  exams               Exam[]');
}

// Subject additions
if (!schema.includes('exams    Exam[]') && schema.includes('updatedAt   DateTime @updatedAt')) {
  // careful here, find Subject model
  const subjRegex = /model Subject \{[\s\S]*?updatedAt   DateTime @updatedAt/;
  schema = schema.replace(subjRegex, (match) => {
    return match.replace('updatedAt   DateTime @updatedAt', 'updatedAt   DateTime @updatedAt\n  exams       Exam[]');
  });
}

// DomainEvent enum update (assuming it exists, otherwise we'll see)
// Actually, I don't see DomainEvent in schema.prisma. Let me just rewrite schema.prisma.

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema updated successfully.');
