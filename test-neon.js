const { Pool } = require('pg');

async function testNeonConnection() {
  const connectionString = process.env.DIRECT_URL;
  
  if (!connectionString) {
    console.error('❌ DIRECT_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔌 Testing Neon database connection...');
  console.log('Connection string:', connectionString.replace(/:[^:]*@/, ':***@'));

  try {
    const pool = new Pool({ connectionString });
    
    // Test simple query
    const res = await pool.query('SELECT NOW()');
    console.log('\n✅ Connection successful!');
    console.log('   Current timestamp:', res.rows[0].now);

    // Test with actual schema
    const schemaCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `);
    console.log('\n📊 Database tables found:');
    schemaCheck.rows.forEach(row => console.log('   -', row.table_name));

    // Test connection pooling
    const poolTest = await pool.query('SELECT COUNT(*) as count FROM pg_tables WHERE schemaname = \'public\'');
    console.log(`\n✨ Total tables in public schema: ${poolTest.rows[0].count}`);

    pool.end();
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testNeonConnection();
