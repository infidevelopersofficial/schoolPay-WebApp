import "dotenv/config";
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const firstNames = ['Aarav', 'Vihaan', 'Aditya', 'Sai', 'Arjun', 'Siddharth', 'Rohan', 'Dhruv', 'Kabir', 'Krishna', 'Diya', 'Ananya', 'Aadhya', 'Saanvi', 'Priya', 'Riya', 'Ishita', 'Sneha', 'Kavya', 'Nisha'];
const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Das', 'Mehta', 'Gupta', 'Verma', 'Nair'];

function getRandomName() {
  const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${fName} ${lName}`;
}

async function main() {
  try {
    const schools = await prisma.school.findMany();
    
    if (schools.length === 0) {
      console.log('No schools found in the database. Please run db:seed first.');
      return;
    }

    console.log(`Found ${schools.length} schools. Adding 10 students to each...`);

    let totalStudentsAdded = 0;

    for (const school of schools) {
      const studentsToCreate: Prisma.StudentCreateManyInput[] = [];
      
      for (let i = 0; i < 10; i++) {
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const admNumber = `ADM-${school.id.substring(0, 4).toUpperCase()}-${randomNum}-${i}`;
        
        studentsToCreate.push({
          name: getRandomName(),
          class: "10",
          section: ["A", "B", "C"][Math.floor(Math.random() * 3)],
          admissionNumber: admNumber,
          studentId: admNumber,
          schoolId: school.id,
          accountStatus: 'PENDING_ACTIVATION',
          feeStatus: 'PENDING',
          totalFees: 50000,
          isActive: true
        });
      }

      // We bypass RLS for seeding by executing a RAW query or we just use normal createMany 
      // If RLS is enabled and requires a tenant context, we need to set the tenant context first.
      // Let's set the tenant context for the current school before inserting.
      
      await prisma.$transaction(async (tx) => {
        // Set the RLS context for this transaction
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant', $1, true)`, school.id);
        
        // Insert the students
        const result = await tx.student.createMany({
          data: studentsToCreate,
          skipDuplicates: true,
        });
        
        console.log(`Added ${result.count} students to school: ${school.name}`);
        totalStudentsAdded += result.count;
      });
    }

    console.log(`\nSuccessfully added ${totalStudentsAdded} students across ${schools.length} schools.`);
  } catch (error) {
    console.error('Error seeding students:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
