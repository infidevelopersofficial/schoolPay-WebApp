const { Client } = require('pg');
async function clean() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const schoolId = await client.query("SELECT id FROM \"School\" WHERE slug = 'test-school-12345'");
    if (schoolId.rows.length > 0) {
      const id = schoolId.rows[0].id;
      await client.query('DELETE FROM "TeacherClassAssignment" WHERE "schoolId" = $1', [id]);
      await client.query('DELETE FROM "TeacherSubject" WHERE "schoolId" = $1', [id]);
      await client.query('DELETE FROM "Class" WHERE "schoolId" = $1', [id]);
      await client.query('DELETE FROM "Teacher" WHERE "schoolId" = $1', [id]);
      await client.query('DELETE FROM "School" WHERE id = $1', [id]);
      console.log("Cleanup done");
    }
  } catch (e) { console.error(e) } finally { client.end() }
}
clean();
