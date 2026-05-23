const fs = require('fs');

let sql = fs.readFileSync('prisma/migrations/20260523_phase_6b_exams/migration.sql', 'utf8');
if (sql.charCodeAt(0) === 0xFEFF) {
  sql = sql.slice(1);
}
fs.writeFileSync('prisma/migrations/20260523_phase_6b_exams/migration.sql', sql, 'utf8');
console.log('Removed BOM from migration.sql');
