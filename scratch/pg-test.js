require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  await client.connect();
  console.log("Connected to database");

  try {
    // 1. Get or create a school
    let schoolRes = await client.query(`SELECT id, "tenantId", slug FROM "School" LIMIT 1`);
    if (schoolRes.rows.length === 0) {
      console.log("No school found, please register one first.");
      process.exit(1);
    }
    const school = schoolRes.rows[0];

    // 2. See if there is a student
    let studentRes = await client.query(`SELECT id, "userId", "admissionNumber", "accountStatus", "portalAccessEnabled" FROM "Student" WHERE "schoolId" = $1 LIMIT 1`, [school.id]);
    
    let student;
    let password = "studentpassword123";
    let hashedPassword = await bcrypt.hash(password, 10);
    
    if (studentRes.rows.length === 0) {
      // Create user
      let userRes = await client.query(`
        INSERT INTO "User" (id, name, email, "hashedPassword", role, "updatedAt") 
        VALUES (gen_random_uuid()::text, 'Demo Student', 'student99@school.com', $1, 'STUDENT', NOW()) RETURNING id`, 
      [hashedPassword]);
      
      const userId = userRes.rows[0].id;
      
      // Create student
      let stuRes = await client.query(`
        INSERT INTO "Student" (id, "userId", name, class, "admissionNumber", "portalAccessEnabled", "accountStatus", "schoolId", "updatedAt")
        VALUES (gen_random_uuid()::text, $1, 'Demo Student', '10', 'ADM-999', true, 'ACTIVE', $2, NOW()) RETURNING *`,
      [userId, school.id]);
      
      student = stuRes.rows[0];
    } else {
      student = studentRes.rows[0];
      // Update password of user and make sure student is ACTIVE and portalAccessEnabled
      if (student.userId) {
        await client.query(`UPDATE "User" SET "hashedPassword" = $1 WHERE id = $2`, [hashedPassword, student.userId]);
      } else {
        // if no userId, student is pending activation maybe
        let userRes = await client.query(`
          INSERT INTO "User" (id, name, email, "hashedPassword", role, "updatedAt") 
          VALUES (gen_random_uuid()::text, 'Demo Student', 'student99@school.com', $1, 'STUDENT', NOW()) RETURNING id`, 
        [hashedPassword]);
        
        await client.query(`UPDATE "Student" SET "userId" = $1, "portalAccessEnabled" = true, "accountStatus" = 'ACTIVE', "admissionNumber" = 'ADM-999' WHERE id = $2`, [userRes.rows[0].id, student.id]);
        student.admissionNumber = 'ADM-999';
      }
    }
    
    // Make sure portalAccess is true
    await client.query(`UPDATE "Student" SET "portalAccessEnabled" = true, "accountStatus" = 'ACTIVE' WHERE id = $1`, [student.id]);
    
    console.log('\n--- TEST CREDENTIALS READY ---');
    console.log('School Code (Tenant ID):', school.tenantId);
    console.log('School Code (Slug):', school.slug);
    console.log('Admission Number:', student.admissionNumber);
    console.log('Password:', password);
    console.log('Use ANY of the School Codes above to test!');

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
