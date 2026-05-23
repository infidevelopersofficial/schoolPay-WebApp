const fs = require('fs');

let sql = fs.readFileSync('scratch/phase6b.sql', 'utf8');

// The original sql has:
// 1. AlterEnum
// 2. DropForeignKey
// 3. DropIndex
// 4. AlterTable Exam DROP COLUMN ... ADD COLUMN
// 5. AlterTable Result DROP COLUMN ... ADD COLUMN
// 6. DropEnum
// 7. CreateTable GradingScheme, GradeBand, ExamGroup, GradeModificationLog
// 8. CreateIndex
// 9. AddForeignKey

// Let's break it down into blocks.
const block4Regex = /-- AlterTable\r?\nALTER TABLE "Exam" DROP COLUMN[\s\S]*?;\r?\n/m;
const block4Match = sql.match(block4Regex);
const block4 = block4Match[0];

const block5Regex = /-- AlterTable\r?\nALTER TABLE "Result" DROP COLUMN[\s\S]*?;\r?\n/m;
const block5Match = sql.match(block5Regex);
const block5 = block5Match[0];

// Remove original blocks 4 and 5
sql = sql.replace(block4, '');
sql = sql.replace(block5, '');

// Now we construct the new flow:
// 1. ADD COLUMNS (Nullable) to Exam and Result
// 2. CreateTable for ExamGroup, etc (which is already later in the file)
// We will just put ADD COLUMNS right after CreateTable ExamGroup

const addColumnsExam = `
-- AlterTable (Add columns to Exam)
ALTER TABLE "Exam" 
ADD COLUMN "batchId" TEXT,
ADD COLUMN "endTime" TIMESTAMP(3),
ADD COLUMN "examGroupId" TEXT,
ADD COLUMN "marksLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "resultsPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sessionId" TEXT,
ADD COLUMN "startTime" TIMESTAMP(3),
ADD COLUMN "subjectId" TEXT;
ALTER TABLE "Exam" ALTER COLUMN "maxMarks" SET DATA TYPE DOUBLE PRECISION;
`;

const addColumnsResult = `
-- AlterTable (Add columns to Result)
ALTER TABLE "Result" 
ADD COLUMN "enteredById" TEXT,
ADD COLUMN "sessionId" TEXT;
ALTER TABLE "Result" ALTER COLUMN "examId" SET NOT NULL;
ALTER TABLE "Result" ALTER COLUMN "marks" DROP NOT NULL;
ALTER TABLE "Result" ALTER COLUMN "grade" DROP NOT NULL;
ALTER TABLE "Result" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
`;

const dataMigration = `
-- ==========================================
-- DATA MIGRATION LOGIC
-- ==========================================
-- 1. Create a default AcademicSession if not exists
INSERT INTO "AcademicSession" ("id", "name", "startDate", "endDate", "isCurrent", "schoolId", "createdAt", "updatedAt")
SELECT 'migrated-session', '2025-2026', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true, id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "School"
WHERE NOT EXISTS (SELECT 1 FROM "AcademicSession")
LIMIT 1;

-- 2. Create a default ExamGroup
INSERT INTO "ExamGroup" ("id", "name", "schoolId", "sessionId", "createdAt", "updatedAt")
SELECT 'migrated-group', 'Migrated Exams', s.id, COALESCE((SELECT id FROM "AcademicSession" LIMIT 1), 'migrated-session'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "School" s
LIMIT 1;

-- 3. Update Exams
UPDATE "Exam" e
SET 
  "batchId" = COALESCE((SELECT id FROM "Batch" WHERE name = e.class LIMIT 1), (SELECT id FROM "Batch" LIMIT 1)),
  "subjectId" = COALESCE((SELECT id FROM "Subject" WHERE name = e.subject LIMIT 1), (SELECT id FROM "Subject" LIMIT 1)),
  "sessionId" = COALESCE((SELECT id FROM "AcademicSession" LIMIT 1), 'migrated-session'),
  "examGroupId" = 'migrated-group'
WHERE "batchId" IS NULL;

-- 4. Delete unmigratable orphaned exams/results
DELETE FROM "Result" WHERE "examId" IN (SELECT id FROM "Exam" WHERE "batchId" IS NULL OR "subjectId" IS NULL);
DELETE FROM "Exam" WHERE "batchId" IS NULL OR "subjectId" IS NULL;

-- 5. Update Results
UPDATE "Result" r
SET "sessionId" = COALESCE((SELECT id FROM "AcademicSession" LIMIT 1), 'migrated-session')
WHERE "sessionId" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "Exam" ALTER COLUMN "batchId" SET NOT NULL;
ALTER TABLE "Exam" ALTER COLUMN "examGroupId" SET NOT NULL;
ALTER TABLE "Exam" ALTER COLUMN "sessionId" SET NOT NULL;
ALTER TABLE "Exam" ALTER COLUMN "subjectId" SET NOT NULL;
ALTER TABLE "Result" ALTER COLUMN "sessionId" SET NOT NULL;
`;

const dropColumns = `
-- Drop old columns
ALTER TABLE "Exam" DROP COLUMN "class", DROP COLUMN "duration", DROP COLUMN "status", DROP COLUMN "subject", DROP COLUMN "time";
ALTER TABLE "Result" DROP COLUMN "examName", DROP COLUMN "maxMarks", DROP COLUMN "percentage";
`;

// Insert the new logic before CreateIndex
const newSQL = sql.replace('-- CreateIndex', addColumnsExam + '\n' + addColumnsResult + '\n' + dataMigration + '\n' + dropColumns + '\n-- CreateIndex');

fs.writeFileSync('prisma/migrations/20260523_phase_6b_exams/migration.sql', newSQL);
console.log('Fixed migration SQL structure.');
