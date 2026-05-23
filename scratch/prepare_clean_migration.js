const fs = require('fs');

let sql = fs.readFileSync('scratch/raw_diff.sql', 'utf16le');
if (!sql.includes('ALTER TABLE')) {
  sql = fs.readFileSync('scratch/raw_diff.sql', 'utf8');
}
if (sql.charCodeAt(0) === 0xFEFF) {
  sql = sql.slice(1);
}

// Ensure CASCADE is on DROP TYPE
sql = sql.replace('DROP TYPE "ExamStatus";', 'DROP TYPE "ExamStatus" CASCADE;');

fs.writeFileSync('prisma/migrations/20260523_phase_6b_exams/migration.sql', sql, 'utf8');
let buf = fs.readFileSync('prisma/migrations/20260523_phase_6b_exams/migration.sql');
if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
  buf = buf.slice(3);
  fs.writeFileSync('prisma/migrations/20260523_phase_6b_exams/migration.sql', buf);
}
console.log('Clean migration ready.');
