const fs = require("fs");

// 1. Fix getChildResults in DAL to include maxMarks
let dal = fs.readFileSync("lib/dal/parent-portal.ts", "utf-8");
dal = dal.replace(/exam: { select: { name: true, subject: true, date: true, examGroup:/g, "exam: { select: { name: true, subject: true, date: true, maxMarks: true, examGroup:");
fs.writeFileSync("lib/dal/parent-portal.ts", dal);

// 2. Fix results page to use proper TS casting
let results = fs.readFileSync("app/(parent-portal)/parent/results/page.tsx", "utf-8");
results = results.replace(/const fullResults = await getChildResults\(student\.id\)\.catch\(\(\) => \[\]\);/g, `let fullResults: any[] = [];
        try {
          fullResults = await getChildResults(student.id);
        } catch(e) {
          console.error(e);
        }`);
// And add a fallback for maxMarks because it could be missing on Exam
results = results.replace(/r\.exam\.maxMarks > 0/g, "(r.exam.maxMarks || 0) > 0");
results = results.replace(/r\.exam\.maxMarks\)/g, "(r.exam.maxMarks || 1))");

fs.writeFileSync("app/(parent-portal)/parent/results/page.tsx", results);
