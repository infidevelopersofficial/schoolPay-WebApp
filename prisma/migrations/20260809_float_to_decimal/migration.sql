-- AlterTable
ALTER TABLE "DiscountRule" ALTER COLUMN "value" SET DATA TYPE DECIMAL(10,2) USING "value"::numeric;

-- AlterTable
ALTER TABLE "Fee" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2) USING "amount"::numeric;

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(10,2) USING "subtotal"::numeric,
ALTER COLUMN "cgstAmount" SET DATA TYPE DECIMAL(10,2) USING "cgstAmount"::numeric,
ALTER COLUMN "sgstAmount" SET DATA TYPE DECIMAL(10,2) USING "sgstAmount"::numeric,
ALTER COLUMN "igstAmount" SET DATA TYPE DECIMAL(10,2) USING "igstAmount"::numeric,
ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2) USING "total"::numeric,
ALTER COLUMN "discountAmount" SET DATA TYPE DECIMAL(10,2) USING "discountAmount"::numeric;

-- AlterTable
ALTER TABLE "InvoicePenalty" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2) USING "amount"::numeric;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2) USING "amount"::numeric;

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "totalFees" SET DATA TYPE DECIMAL(10,2) USING "totalFees"::numeric,
ALTER COLUMN "paidAmount" SET DATA TYPE DECIMAL(10,2) USING "paidAmount"::numeric,
ALTER COLUMN "pendingAmount" SET DATA TYPE DECIMAL(10,2) USING "pendingAmount"::numeric;

-- AlterTable
ALTER TABLE "Teacher" ALTER COLUMN "salary" SET DATA TYPE DECIMAL(10,2) USING "salary"::numeric;
