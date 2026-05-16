const { Pool } = require('pg');

async function testConnection() {
  // Try various connection methods
  const configs = [
    { name: 'via socket (local)', connectionString: 'postgresql:///schoolpay' },
    { name: 'localhost, postgres user, no password', host: 'localhost', port: 5432, user: 'postgres', password: '', database: 'schoolpay' },
    { name: 'localhost, postgres user, trust auth', host: 'localhost', port: 5432, user: 'postgres', database: 'schoolpay' },
  ];
  
  for (const config of configs) {
    console.log(`\n🔍 Trying: ${config.name}`);
    
    try {
      const pool = new Pool(config);
      const res = await pool.query('SELECT NOW(), current_user');
      console.log('✅ SUCCESS!');
      console.log('   Connected as:', res.rows[0].current_user);
      console.log('   Current time:', res.rows[0].now);
      pool.end();
      return config;
    } catch (err) {
      console.log('❌ Failed:', err.message.split('\n')[0]);
    }
  }
  
  console.log('\n⚠️  Could not connect to PostgreSQL');
}

testConnection();
