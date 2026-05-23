const fs = require('fs');

let buf = fs.readFileSync('prisma/migrations/20260523_phase_6b_exams/migration.sql');
if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
  buf = buf.slice(3);
}

fs.writeFileSync('prisma/migrations/20260523_phase_6b_exams/migration.sql', buf);
console.log('BOM removed from raw buffer.');
