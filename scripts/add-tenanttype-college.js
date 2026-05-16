const { Pool } = require('pg');

(async ()=>{
  const pool = new Pool({ host:'localhost', port:5432, user:'postgres', database:'schoolpay' });
  try {
    const res = await pool.query(`SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname='TenantType' AND e.enumlabel='COLLEGE'`);
    if (res.rows.length > 0) {
      console.log('✅ TenantType COLLEGE already exists');
    } else {
      await pool.query(`ALTER TYPE "TenantType" ADD VALUE 'COLLEGE'`);
      console.log('✅ Added TenantType COLLEGE');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally { await pool.end(); }
})();
