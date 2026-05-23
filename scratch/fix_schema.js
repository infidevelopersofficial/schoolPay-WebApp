const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Replace duplicate "exams" in School model
// I will just find the string `attendanceRegisters AttendanceRegister[]\n  exams               Exam[]`
// and remove the `\n  exams               Exam[]`
schema = schema.replace('attendanceRegisters AttendanceRegister[]\n  exams               Exam[]', 'attendanceRegisters AttendanceRegister[]');

fs.writeFileSync('prisma/schema.prisma', schema);
