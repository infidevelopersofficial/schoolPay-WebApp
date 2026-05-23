const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();

  const examRes = await client.query('SELECT COUNT(*) FROM "Exam"');
  const resultRes = await client.query('SELECT COUNT(*) FROM "Result"');
  
  const classRes = await client.query('SELECT DISTINCT class FROM "Exam"');
  const subjectRes = await client.query('SELECT DISTINCT subject FROM "Exam"');

  console.log('Exams:', examRes.rows[0].count);
  console.log('Results:', resultRes.rows[0].count);
  console.log('Classes:', classRes.rows.map(r => r.class));
  console.log('Subjects:', subjectRes.rows.map(r => r.subject));

  await client.end();
}

main().catch(console.error);
