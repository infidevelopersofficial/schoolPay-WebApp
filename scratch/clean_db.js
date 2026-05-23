const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_uEtm5aNXBv7R@ep-holy-violet-aq4enfxv-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  });
  await client.connect();

  try {
    await client.query(`DELETE FROM "Result"`);
    await client.query(`DELETE FROM "Exam"`);
    console.log("Deleted old data from Result and Exam.");
  } catch (e) {
    console.error(e.message);
  }

  await client.end();
}

main().catch(console.error);
