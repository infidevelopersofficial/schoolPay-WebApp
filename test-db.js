const { Pool } = require('pg');

async function testConnection() {
  const passwords = ['postgres', 'schoolpay', '123456', ''];
  
  for (const pwd of passwords) {
    const connStr = pwd 
      ? `postgresql://postgres:${pwd}@localhost:5432/schoolpay?schema=public`
      : 'postgresql://postgres@localhost:5432/schoolpay?schema=public';
    
    console.log(`Testing with password: "${pwd || '(empty)'}"`);
    
    try {
      const pool = new Pool({ connectionString: connStr });
      const res = await pool.query('SELECT NOW()');
      console.log('✅ SUCCESS with password:', pwd || '(empty)');
      console.log('Connected at:', res.rows[0]);
      pool.end();
      return pwd;
    } catch (err) {
      console.log(`❌ Failed:`, err.message.split('\n')[0]);
      if (pwd === passwords[passwords.length - 1]) {
        console.log('\n⚠️  Could not connect with any default password');
      }
    }
  }
}

testConnection();
