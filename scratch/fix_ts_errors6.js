const fs = require("fs");

function replaceAny(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  content = content.replace(/students\.map\(\(student\) =>/g, "students.map((student: any) =>");
  content = content.replace(/students\.map\(async \(student\) =>/g, "students.map(async (student: any) =>");
  fs.writeFileSync(filePath, content);
}

replaceAny("app/(parent-portal)/parent/attendance/page.tsx");
replaceAny("app/(parent-portal)/parent/dashboard/page.tsx");
replaceAny("app/(parent-portal)/parent/fees/page.tsx");
replaceAny("app/(parent-portal)/parent/results/page.tsx");
