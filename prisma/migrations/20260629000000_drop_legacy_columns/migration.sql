-- DropIndex
DROP INDEX "Teacher_subject_idx";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "classTeacher";

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "class",
DROP COLUMN "subject";

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

