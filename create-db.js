const { Pool } = require('pg');

async function createDatabase() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    database: 'postgres',
  });

  try {
    // Check if database exists
    const result = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'schoolpay'"
    );

    if (result.rows.length > 0) {
      console.log('✅ Database "schoolpay" already exists');
    } else {
      await pool.query('CREATE DATABASE schoolpay;');
      console.log('✅ Database "schoolpay" created');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

createDatabase();
