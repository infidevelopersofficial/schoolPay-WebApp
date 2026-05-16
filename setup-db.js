const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    database: 'schoolpay',
  });

  try {
    const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  No migrations directory found');
      return;
    }

    const migrations = fs.readdirSync(migrationsDir)
      .filter((f) => fs.statSync(path.join(migrationsDir, f)).isDirectory())
      .sort();

    if (migrations.length === 0) {
      console.log('⚠️  No migrations found');
      return;
    }

    for (const mig of migrations) {
      const migrationPath = path.join(migrationsDir, mig, 'migration.sql');
      if (!fs.existsSync(migrationPath)) {
        console.log(`ℹ️  Skipping ${mig} — no migration.sql`);
        continue;
      }

      const sql = fs.readFileSync(migrationPath, 'utf-8').trim();
      if (!sql) {
        console.log(`ℹ️  Skipping ${mig} — empty migration.sql`);
        continue;
      }

      console.log(`📋 Applying migration: ${mig}`);

      try {
        // Execute the SQL for this migration
        await pool.query(sql);
        console.log(`✅ Applied: ${mig}`);
      } catch (err) {
        console.error(`❌ Failed migration ${mig}:`, err.message);
        throw err; // stop on first failure
      }
    }

    console.log('🎉 All migrations applied (or skipped when absent)');
  } catch (err) {
    console.error('❌ Error during migration run:', err.message);
  } finally {
    await pool.end();
  }
}

setupDatabase();
