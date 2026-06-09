import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';

async function simulateOnboarding(userId: string, schoolId: string, tenantType: string) {
  const startTime = Date.now();
  try {
    // This simulates the transaction block directly against the database to test contention.
    await prisma.$transaction(async (tx) => {
      // 1. Update School
      await tx.school.update({
        where: { id: schoolId },
        data: {
          slug: `loadtest-${schoolId}`,
          onboardingStatus: "COMPLETED",
          onboardingCompletedAt: new Date()
        }
      });

      // 2. Audit Log
      await tx.auditLog.create({
        data: {
          action: "ONBOARDING_COMPLETED",
          entityType: "School",
          entityId: schoolId,
          schoolId: schoolId,
          userId: userId,
          description: "Load test onboarding"
        }
      });

      // 3. Defaults
      const sessionData = await tx.academicSession.create({
        data: {
          name: "2026-2027",
          startDate: new Date(),
          endDate: new Date(),
          isCurrent: true,
          schoolId
        }
      });

      const classData = Array.from({ length: 5 }).map((_, i) => ({
        name: `Class ${i + 1}`,
        section: "A",
        capacity: 40,
        schoolId
      }));
      
      await tx.class.createMany({ data: classData });
      
      await tx.fee.create({
        data: {
          type: "Tuition Fee",
          amount: 2000,
          description: "Monthly Tuition",
          frequency: "MONTHLY",
          sessionId: sessionData.id,
          schoolId
        }
      });
    });
    
    return { success: true, duration: Date.now() - startTime };
  } catch (e: any) {
    return { success: false, duration: Date.now() - startTime, error: e.message };
  }
}

async function runLoadTest(concurrentUsers: number) {
  console.log(`Starting load test with ${concurrentUsers} concurrent requests...`);
  
  // Create mock schools and users
  const tenants = await Promise.all(
    Array.from({ length: concurrentUsers }).map(async () => {
      const user = await prisma.user.create({
        data: { name: 'Load User', email: `load-${randomUUID()}@test.com`, role: 'ADMIN' }
      });
      const school = await prisma.school.create({
        data: {
          name: 'Load School',
          slug: `prep-${randomUUID()}`,
          schoolCode: `LOAD-${randomUUID().substring(0, 5)}`,
          type: 'SCHOOL',
        }
      });
      return { userId: user.id, schoolId: school.id };
    })
  );

  const start = Date.now();
  
  // Fire all requests concurrently
  const results = await Promise.all(
    tenants.map(t => simulateOnboarding(t.userId, t.schoolId, 'SCHOOL'))
  );

  const totalTime = Date.now() - start;
  const successes = results.filter(r => r.success);
  const failures = results.filter(r => !r.success);
  
  const avgDuration = results.reduce((acc, r) => acc + r.duration, 0) / concurrentUsers;
  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  const p95 = durations[Math.floor(concurrentUsers * 0.95)];

  console.log('--- Results ---');
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Success Rate: ${(successes.length / concurrentUsers) * 100}%`);
  console.log(`Failure Rate: ${(failures.length / concurrentUsers) * 100}%`);
  console.log(`Avg Response Time: ${avgDuration.toFixed(2)}ms`);
  console.log(`P95 Response Time: ${p95}ms`);
  if (failures.length > 0) {
    console.log('Sample Error:', failures[0].error);
  }

  // Cleanup
  await prisma.school.deleteMany({ where: { id: { in: tenants.map(t => t.schoolId) } } });
  await prisma.user.deleteMany({ where: { id: { in: tenants.map(t => t.userId) } } });
}

async function main() {
  await runLoadTest(10);
  console.log('\n=================================\n');
  await runLoadTest(50);
  // Skipped 100 on local shadow DB to prevent OOM
}

main().catch(console.error).finally(() => prisma.$disconnect());
