import { Client } from 'pg'

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_uEtm5aNXBv7R@ep-round-mouse-aqapbo0w-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
})

async function main() {
  await client.connect()
  const tables = ['School', 'User', 'Student', 'Teacher', 'Parent'];
  for (const table of tables) {
    const countRes = await client.query(`SELECT count(*) FROM "${table}"`);
    console.log(`${table} count:`, countRes.rows[0].count);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => client.end())
