-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_examId_fkey";

-- DropIndex
DROP INDEX "Exam_status_idx";

-- DropIndex
DROP INDEX "Exam_teacherId_idx";

-- DropIndex
DROP INDEX "Result_examId_idx";

-- AlterTable
ALTER TABLE "Exam" DROP COLUMN "class",
DROP COLUMN "duration",
DROP COLUMN "status",
DROP COLUMN "subject",
DROP COLUMN "time",
ADD COLUMN     "batchId" TEXT NOT NULL,
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "examGroupId" TEXT NOT NULL,
ADD COLUMN     "marksLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resultsPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sessionId" TEXT NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3),
ADD COLUMN     "subjectId" TEXT NOT NULL,
ALTER COLUMN "maxMarks" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Result" DROP COLUMN "examName",
DROP COLUMN "maxMarks",
DROP COLUMN "percentage",
ADD COLUMN     "enteredById" TEXT,
ADD COLUMN     "sessionId" TEXT NOT NULL,
ALTER COLUMN "examId" SET NOT NULL,
ALTER COLUMN "marks" DROP NOT NULL,
ALTER COLUMN "grade" DROP NOT NULL;

-- DropEnum
DROP TYPE "ExamStatus";

-- CreateTable
CREATE TABLE "GradingScheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeBand" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minMarks" DOUBLE PRECISION NOT NULL,
    "maxMarks" DOUBLE PRECISION NOT NULL,
    "points" DOUBLE PRECISION,
    "remarksTemplate" TEXT,

    CONSTRAINT "GradeBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "gradingSchemeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeModificationLog" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "oldMarks" DOUBLE PRECISION,
    "newMarks" DOUBLE PRECISION,
    "oldGrade" TEXT,
    "newGrade" TEXT,
    "reason" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeModificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamGroup_schoolId_idx" ON "ExamGroup"("schoolId");

-- CreateIndex
CREATE INDEX "ExamGroup_sessionId_idx" ON "ExamGroup"("sessionId");

-- CreateIndex
CREATE INDEX "Exam_batchId_idx" ON "Exam"("batchId");

-- CreateIndex
CREATE INDEX "Exam_subjectId_idx" ON "Exam"("subjectId");

-- CreateIndex
CREATE INDEX "Exam_sessionId_idx" ON "Exam"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_examId_studentId_key" ON "Result"("examId", "studentId");

-- AddForeignKey
ALTER TABLE "GradingScheme" ADD CONSTRAINT "GradingScheme_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeBand" ADD CONSTRAINT "GradeBand_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "GradingScheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamGroup" ADD CONSTRAINT "ExamGroup_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamGroup" ADD CONSTRAINT "ExamGroup_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamGroup" ADD CONSTRAINT "ExamGroup_gradingSchemeId_fkey" FOREIGN KEY ("gradingSchemeId") REFERENCES "GradingScheme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_examGroupId_fkey" FOREIGN KEY ("examGroupId") REFERENCES "ExamGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeModificationLog" ADD CONSTRAINT "GradeModificationLog_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "Result"("id") ON DELETE CASCADE ON UPDATE CASCADE;

