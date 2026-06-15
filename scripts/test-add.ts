import 'dotenv/config';
import { prisma, tenantContext } from '../lib/prisma';
import { addTeacherAction } from '../app/(dashboard)/dashboard/teachers/actions';

async function run() {
  const school = await prisma.school.findFirst();
  if (!school) return console.error("No school found");
  
  await tenantContext.run({ schoolId: school.id }, async () => {
    try {
      const formData = new FormData();
      formData.append("name", "Test");
      formData.append("email", "test3@test.com");
      formData.append("phone", "123");
      formData.append("subject", "Math");
      formData.append("class", "10A");
      
      // Mock auth session by wrapping the action or just checking if the auth mock is needed
      const res = await addTeacherAction(null, formData);
      console.log("Action Res:", res);
    } catch (e) {
      console.error("Error:", e);
    }
  });
}

run().finally(() => prisma.$disconnect());
