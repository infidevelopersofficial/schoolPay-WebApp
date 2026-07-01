const { Client } = require('pg');

async function check() {
  const client = new Client({ connectionString: "postgresql://neondb_owner:npg_uEtm5aNXBv7R@ep-round-mouse-aqapbo0w-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require" });
  try {
    await client.connect();
    const res = await client.query(`SELECT is_nullable, data_type FROM information_schema.columns WHERE table_name = 'Class' AND column_name = 'classTeacher'`);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
check();
