const { Pool } = require('pg');

(async ()=>{
  const pool = new Pool({ host:'localhost', port:5432, user:'postgres', database:'schoolpay' });
  try {
    const sql = `SELECT table_schema, table_name, column_name FROM information_schema.columns WHERE table_name ILIKE '%school%';`;
    const res = await pool.query(sql);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('ERR:', err.message);
  } finally {
    await pool.end();
  }
})();
