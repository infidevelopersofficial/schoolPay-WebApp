const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_uEtm5aNXBv7R@ep-holy-violet-aq4enfxv-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  });
  await client.connect();

  const res = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'Exam'
  `);
  console.log(res.rows.map(r => r.column_name));

  await client.end();
}

main().catch(console.error);
