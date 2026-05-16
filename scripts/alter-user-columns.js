const { Pool } = require('pg');

(async ()=>{
  const pool = new Pool({ host:'localhost', port:5432, user:'postgres', database:'schoolpay' });
  try {
    const stmts = [
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" TIMESTAMP;`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP;`
    ];
    for (const s of stmts) {
      console.log('Running:', s);
      await pool.query(s);
    }
    console.log('✅ User table altered (missing columns added)');
  } catch (err) {
    console.error('❌ Error altering User table:', err.message);
  } finally {
    await pool.end();
  }
})();
