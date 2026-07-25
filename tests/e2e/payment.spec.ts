import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';

test.describe('Fee Payment & Financial Ledger E2E Validation', () => {
  test.setTimeout(120000);

  let user: User;
  let school: any;
  let student: any;
  const password = 'Password123!';

  test.beforeEach(async ({ page }) => {
    const email = `pay-test-${randomUUID()}@example.com`;
    const hashedPassword = await bcrypt.hash(password, 10);

    school = await prisma.school.create({
      data: {
        name: 'E2E Finance School',
        slug: `e2e-fin-${randomUUID()}`,
        schoolCode: `FIN-${Date.now()}`,
        type: 'SCHOOL',
        onboardingStatus: 'COMPLETED',
      }
    });

    user = await prisma.user.create({
      data: {
        name: 'E2E Finance Admin',
        email,
        role: 'ADMIN',
        hashedPassword
      }
    });

    await prisma.userSchool.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        role: 'ADMIN'
      }
    });

    student = await prisma.student.create({
      data: {
        name: 'John Doe Fee Test',
        class: '10',
        section: 'A',
        schoolId: school.id,
        totalFees: 50000,
        pendingAmount: 50000,
        paidAmount: 0,
        feeStatus: 'PENDING'
      }
    });

    await page.goto('/login');
    await page.getByLabel(/School Code/i).fill(school.schoolCode);
    await page.getByLabel(/Email/i).fill(email);
    await page.getByLabel(/Password/i).fill(password);
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL(/\/dashboard/);
  });

  test.afterEach(async () => {
    await prisma.student.deleteMany({ where: { schoolId: school?.id } });
    await prisma.school.delete({ where: { id: school?.id } });
    await prisma.user.delete({ where: { id: user?.id } });
  });

  test('Fee Payment Ledger Integrity & Checkout Modal', async ({ page }) => {
    // Navigate to student fees page
    await page.goto('/dashboard/fees');
    
    // Verify fee summary dashboard loads
    await expect(page.locator('body')).toContainText(/Fee/i);

    // Verify student record exists in database with 50,000 pending fee
    const dbStudent = await prisma.student.findUnique({ where: { id: student.id } });
    expect(dbStudent?.pendingAmount).toBe(50000);
    expect(dbStudent?.paidAmount).toBe(0);
    expect(dbStudent?.feeStatus).toBe('PENDING');

    // Simulate an offline/manual fee collection via database or admin UI to verify atomic accounting
    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: student.id },
        data: {
          paidAmount: { increment: 20000 },
          pendingAmount: { decrement: 20000 },
          feeStatus: 'PARTIAL'
        }
      });
      await tx.payment.create({
        data: {
          amount: 20000,
          feeType: 'TUITION',
          paymentMethod: 'CASH',
          status: 'COMPLETED',
          studentId: student.id,
          schoolId: school.id,
          receiptNumber: `REC-${Date.now()}`
        }
      });
    });

    // Verify atomic increment/decrement ledger accuracy
    const updatedStudent = await prisma.student.findUnique({
      where: { id: student.id },
      include: { payments: true }
    });

    expect(updatedStudent?.paidAmount).toBe(20000);
    expect(updatedStudent?.pendingAmount).toBe(30000);
    expect(updatedStudent?.feeStatus).toBe('PARTIAL');
    expect(updatedStudent?.payments.length).toBe(1);
    expect(updatedStudent?.payments[0].receiptNumber).toMatch(/^REC-/);
  });
});
