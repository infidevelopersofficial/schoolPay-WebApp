import { Client } from 'pg';
import fs from 'fs';

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_uEtm5aNXBv7R@ep-round-mouse-aqapbo0w-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function main() {
  await client.connect();

  const schemaContent = fs.readFileSync('prisma/schema.prisma', 'utf-8');
  const modelRegex = /^model\s+([A-Za-z0-9_]+)\s+{/gm;
  const prismaModels = new Set<string>();
  let match;
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    prismaModels.add(match[1]);
  }

  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  const dbTables = new Set<string>();
  for (const row of res.rows) {
    if (row.table_name !== '_prisma_migrations') {
      dbTables.add(row.table_name);
    }
  }

  const missingInDb = [];
  const extraInDb = [];
  
  for (const model of prismaModels) {
    if (!dbTables.has(model)) missingInDb.push(model);
  }
  for (const table of dbTables) {
    if (!prismaModels.has(table)) extraInDb.push(table);
  }

  console.log("=== SCHEMA VERIFICATION RESULT ===");
  if (missingInDb.length === 0 && extraInDb.length === 0) {
    console.log("PASS: All Prisma models match DB tables perfectly.");
  } else {
    console.log("FAIL: Schema mismatch detected!");
    if (missingInDb.length > 0) console.log("- Prisma models with NO matching DB table:", missingInDb.join(', '));
    if (extraInDb.length > 0) console.log("- Extra DB tables not in Prisma schema:", extraInDb.join(', '));
  }

  const fkRes = await client.query(`
    SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public';
  `);
  
  console.log(`Total Foreign Keys Found in DB: ${fkRes.rows.length}`);
  if (fkRes.rows.length > 0) {
     console.log("PASS: Database contains foreign key constraints.");
  } else {
     console.log("FAIL: No foreign keys found in the database. Prisma expects constraints!");
  }
}

main().catch(console.error).finally(() => client.end());
