const fs = require('fs');

let sql = fs.readFileSync('scratch/phase6b.sql', 'utf8');

// Replace NOT NULL adds with NULLable adds for Exam
sql = sql.replace('ADD COLUMN     "batchId" TEXT NOT NULL', 'ADD COLUMN     "batchId" TEXT');
sql = sql.replace('ADD COLUMN     "examGroupId" TEXT NOT NULL', 'ADD COLUMN     "examGroupId" TEXT');
sql = sql.replace('ADD COLUMN     "sessionId" TEXT NOT NULL', 'ADD COLUMN     "sessionId" TEXT');
sql = sql.replace('ADD COLUMN     "subjectId" TEXT NOT NULL', 'ADD COLUMN     "subjectId" TEXT');

// Replace NOT NULL adds for Result
sql = sql.replace('ADD COLUMN     "sessionId" TEXT NOT NULL', 'ADD COLUMN     "sessionId" TEXT');

// Append the data migration logic at the end before adding foreign keys, 
// wait, foreign keys will fail if they are null. Let's add the data migration right after ALTER TABLE Result.
const migrationLogic = `
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

-- 3. Update Exams with matched Batch, Subject, Session, ExamGroup
UPDATE "Exam" e
SET 
  "batchId" = COALESCE((SELECT id FROM "Batch" WHERE name = e.class LIMIT 1), (SELECT id FROM "Batch" LIMIT 1)),
  "subjectId" = COALESCE((SELECT id FROM "Subject" WHERE name = e.subject LIMIT 1), (SELECT id FROM "Subject" LIMIT 1)),
  "sessionId" = (SELECT id FROM "AcademicSession" LIMIT 1),
  "examGroupId" = (SELECT id FROM "ExamGroup" LIMIT 1)
WHERE "batchId" IS NULL;

-- If there are still exams with NULL batchId/subjectId (meaning no Batch/Subject exists at all), delete them or create dummies. 
-- Since it's test data, we will safely delete un-migratable ones to avoid NOT NULL constraint errors.
DELETE FROM "Result" WHERE "examId" IN (SELECT id FROM "Exam" WHERE "batchId" IS NULL OR "subjectId" IS NULL);
DELETE FROM "Exam" WHERE "batchId" IS NULL OR "subjectId" IS NULL;

-- 4. Update Results with matched Session
UPDATE "Result" r
SET 
  "sessionId" = (SELECT id FROM "AcademicSession" LIMIT 1)
WHERE "sessionId" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "Exam" ALTER COLUMN "batchId" SET NOT NULL;
ALTER TABLE "Exam" ALTER COLUMN "examGroupId" SET NOT NULL;
ALTER TABLE "Exam" ALTER COLUMN "sessionId" SET NOT NULL;
ALTER TABLE "Exam" ALTER COLUMN "subjectId" SET NOT NULL;
ALTER TABLE "Result" ALTER COLUMN "sessionId" SET NOT NULL;

-- ==========================================
`;

// Insert the migration logic right before -- DropEnum
sql = sql.replace('-- DropEnum', migrationLogic + '\n-- DropEnum');

fs.writeFileSync('prisma/migrations/20260523_phase_6b_exams/migration.sql', sql);

console.log('Migration SQL generated successfully.');
