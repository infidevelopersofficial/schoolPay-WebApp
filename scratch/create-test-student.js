const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.upsert({
    where: { slug: 'default-school' },
    update: {},
    create: {
      name: 'Default School',
      slug: 'default-school',
      tenantId: 'SCH-00001',
      type: 'SCHOOL',
      onboardingStatus: 'COMPLETED'
    }
  });

  const password = 'studentpassword';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: 'student99@school.com' },
    update: { hashedPassword },
    create: {
      name: 'Test Student',
      email: 'student99@school.com',
      hashedPassword,
      role: 'STUDENT'
    }
  });

  const student = await prisma.student.upsert({
    where: { userId: user.id },
    update: {
      admissionNumber: 'ADM-999',
      portalAccessEnabled: true,
      accountStatus: 'ACTIVE',
      schoolId: school.id
    },
    create: {
      userId: user.id,
      name: 'Test Student',
      class: '10',
      admissionNumber: 'ADM-999',
      portalAccessEnabled: true,
      accountStatus: 'ACTIVE',
      schoolId: school.id
    }
  });

  console.log('--- TEST STUDENT CREDENTIALS ---');
  console.log('School Code (Tenant ID):', school.tenantId);
  console.log('School Code (Slug):', school.slug);
  console.log('Admission Number:', student.admissionNumber);
  console.log('Password:', password);
}

main().catch(console.error).finally(() => prisma.$disconnect());
