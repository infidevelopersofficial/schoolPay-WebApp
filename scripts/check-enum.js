const { Pool } = require('pg');

(async ()=>{
  const pool = new Pool({ host:'localhost', port:5432, user:'postgres', database:'schoolpay' });
  try {
    const sql = `SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'TenantType';`;
    const res = await pool.query(sql);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('ERR:', err.message);
  } finally {
    await pool.end();
  }
})();
