require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addUsers() {
  try {
    // Every demo user must be linked to a school via UserSchool — without
    // this membership, /select-school renders "No Schools Found" and the
    // user can't access the dashboard.
    const school = await prisma.school.findFirst({
      where: { slug: 'default-school' },
      select: { id: true },
    });
    if (!school) {
      throw new Error(
        'Default school not found. Run `npx tsx prisma/seed.ts` first to seed the tenant.',
      );
    }

    const users = [
      { name: 'Student One', email: 'student1@school.com', password: 'student123', role: 'STUDENT' },
      { name: 'Student Two', email: 'student2@school.com', password: 'student123', role: 'STUDENT' },
      { name: 'Student Three', email: 'student3@school.com', password: 'student123', role: 'STUDENT' },
      { name: 'Teacher One', email: 'teacher1@school.com', password: 'teacher123', role: 'TEACHER' },
      { name: 'Teacher Two', email: 'teacher2@school.com', password: 'teacher123', role: 'TEACHER' },
      { name: 'Parent One', email: 'parent1@school.com', password: 'parent123', role: 'PARENT' },
      { name: 'Parent Two', email: 'parent2@school.com', password: 'parent123', role: 'PARENT' },
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);

      const upserted = await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          name: user.name,
          email: user.email,
          hashedPassword,
          role: user.role,
          isActive: true,
        },
      });

      await prisma.userSchool.upsert({
        where: { userId_schoolId: { userId: upserted.id, schoolId: school.id } },
        update: {},
        create: { userId: upserted.id, schoolId: school.id, role: user.role },
      });

      console.log(`✅ Ready: ${upserted.email} (${upserted.role}) → ${school.id}`);
    }

    console.log('\n✅ User + membership creation completed!');
  } catch (error) {
    console.error('Error creating users:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

addUsers();
