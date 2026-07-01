const { Client } = require('pg');
async function check() {
  const client = new Client({ connectionString: "postgresql://neondb_owner:npg_uEtm5aNXBv7R@ep-round-mouse-aqapbo0w-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require" });
  try {
    await client.connect();
    const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_name IN ('TeacherSubject', 'TeacherClassAssignment')`);
    console.log("Tables found:", tables.rows);
    const columns = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Class' AND column_name = 'classTeacherId'`);
    console.log("Columns found in Class:", columns.rows);
  } finally {
    await client.end();
  }
}
check();
