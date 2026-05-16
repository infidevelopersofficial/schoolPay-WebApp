const { Pool } = require('pg');

(async ()=>{
  const pool = new Pool({ host:'localhost', port:5432, user:'postgres', database:'schoolpay' });
  try {
    const stmts = [
      `ALTER TABLE "School" ADD COLUMN IF NOT EXISTS city TEXT;`,
      `ALTER TABLE "School" ADD COLUMN IF NOT EXISTS pincode TEXT;`,
      `ALTER TABLE "School" ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'IN';`,
      `ALTER TABLE "School" ADD COLUMN IF NOT EXISTS website TEXT;`,
      `ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "panNumber" TEXT;`
    ];
    for (const s of stmts) {
      console.log('Running:', s);
      await pool.query(s);
    }
    console.log('✅ School table altered (missing columns added)');
  } catch (err) {
    console.error('❌ Error altering School table:', err.message);
  } finally {
    await pool.end();
  }
})();
