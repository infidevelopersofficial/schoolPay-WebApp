const fs = require('fs');

let sql = fs.readFileSync('prisma/migrations/20260523_phase_6b_exams/migration.sql', 'utf8');
sql = sql.replace('\\n', '\n');
fs.writeFileSync('prisma/migrations/20260523_phase_6b_exams/migration.sql', sql, 'utf8');
console.log('Fixed newline.');
