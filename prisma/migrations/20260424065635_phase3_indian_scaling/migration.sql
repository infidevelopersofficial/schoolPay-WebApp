-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "batchId" TEXT;

-- CreateIndex
CREATE INDEX "Attendance_batchId_idx" ON "Attendance"("batchId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
