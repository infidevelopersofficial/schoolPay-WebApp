-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "discountAmount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "discountReason" TEXT;

-- AlterTable
ALTER TABLE "Parent" ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "state" TEXT;

-- CreateTable
CREATE TABLE "AcademicSession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcademicSession_schoolId_idx" ON "AcademicSession"("schoolId");

-- AddForeignKey
ALTER TABLE "AcademicSession" ADD CONSTRAINT "AcademicSession_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
