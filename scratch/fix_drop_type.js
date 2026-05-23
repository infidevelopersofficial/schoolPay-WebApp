const fs = require('fs');
let str = fs.readFileSync('prisma/migrations/20260523_phase_6b_exams/migration.sql', 'utf8');
str = str.replace('DROP TYPE "ExamStatus";', 'DROP TYPE "ExamStatus" CASCADE;');
fs.writeFileSync('prisma/migrations/20260523_phase_6b_exams/migration.sql', str, 'utf8');
