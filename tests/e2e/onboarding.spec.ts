import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../../lib/prisma';

import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';

test.describe('Onboarding E2E Validation', () => {
  test.setTimeout(120000); // 120 seconds to account for Neon DB cold starts

  let user: User;
  let school;
  const password = 'Password123!';

  test.beforeEach(async ({ page }) => {
    // 1. Create a mock tenant (School) and User
    const email = `test-${randomUUID()}@example.com`;
    const hashedPassword = await bcrypt.hash(password, 10);

    school = await prisma.school.create({
      data: {
        name: 'E2E Test School',
        slug: `e2e-slug-${randomUUID()}`,
        schoolCode: `E2E-${Date.now()}`,
        type: 'SCHOOL',
        onboardingStatus: 'NOT_STARTED',
      }
    });

    user = await prisma.user.create({
      data: {
        name: 'E2E Test Admin',
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

    // Perform actual UI Login to generate valid JWT
    await page.goto('/login');
    await page.getByLabel(/School Code/i).fill(school.schoolCode);
    await page.getByLabel(/Email/i).fill(email);
    await page.getByLabel(/Password/i).fill(password);
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL(/\/dashboard/);
  });

  test.afterEach(async () => {
    // Cleanup
    await prisma.school.delete({ where: { id: school.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  test('School Onboarding Flow - Success & Idempotency', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('status of 404') || text.includes('Server Components render')) return;
        errors.push(text);
      }
    });
    page.on('pageerror', err => errors.push(err.message));

    // Wait for the app to load
    await page.goto('/dashboard/onboarding');

    // Verify we are on the wizard
    await expect(page.getByText(/Organization Details/i)).toBeVisible();
    
    // Fill out Step 1 (Organization)
    await page.locator('input[name="slug"]').fill(`school-slug-${Date.now()}`);
    await page.locator('select[name="region"]').selectOption('India');
    await page.locator('select[name="language"]').selectOption('English');
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Fill out Step 2 (Location)
    await page.locator('input[name="state"]').fill('Maharashtra');
    await page.locator('input[name="city"]').fill('Mumbai');
    await page.locator('select[name="currency"]').selectOption('INR');
    await page.getByRole('button', { name: 'Next Step' }).click();

    // Fill out Step 3 (Academic setup)
    await page.locator('input[name="academicYear"]').fill('2026-2027');
    await page.locator('input[name="classesCount"]').fill('5');
    
    // Complete Setup (Double click test for idempotency)
    const completeButton = page.getByRole('button', { name: /Complete Setup/i });
    await completeButton.click();
    
    // Rapid double click to test idempotency
    try {
      await completeButton.click({ timeout: 1000 });
    } catch (e) {
      // Button likely disabled or navigated away, which is good
    }

    // DEBUG: Print any console errors captured so far
    if (errors.length > 0) {
      console.log("PAGE ERRORS CAUGHT BEFORE URL TRANSITION:", errors);
    }

    // Wait to see if a toast appears (either error or success)
    try {
      const toast = page.locator('[role="region"][aria-label="Notifications (F8)"]');
      await toast.waitFor({ state: 'visible', timeout: 5000 });
      const toastText = await toast.innerText();
      console.log("TOAST APPEARED:", toastText);
    } catch (e) {
      console.log("No toast appeared within 5s");
    }

    // Verify Redirect to Dashboard
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30000 });
    
    // Verify Activation Checklist
    await expect(page.getByText(/Workspace Created/i)).toBeVisible();
    
    // Assert no console/hydration errors
    expect(errors).toHaveLength(0);

    // Verify Database state directly
    const updatedSchool = await prisma.school.findUnique({
      where: { id: school.id },
      include: { classes: true, sessions: true, auditLogs: true, fees: true }
    });

    expect(updatedSchool?.onboardingStatus).toBe('COMPLETED');
    expect(updatedSchool?.sessions.length).toBe(1);
    expect(updatedSchool?.classes.length).toBe(5); // Requested 5 classes
    expect(updatedSchool?.fees.length).toBe(1); // 1 Default fee
    expect(updatedSchool?.auditLogs.length).toBeGreaterThanOrEqual(2); // ONBOARDING_COMPLETED and DEFAULT_DATA_CREATED
  });
});
