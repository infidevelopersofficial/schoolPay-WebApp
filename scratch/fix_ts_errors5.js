const fs = require("fs");

function replaceAny(filePath, regex, replacement) {
  let content = fs.readFileSync(filePath, "utf-8");
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content);
}

// Announcements
replaceAny("app/(parent-portal)/parent/announcements/page.tsx", /announcements\.map\(\(ann\)/g, "announcements.map((ann: any)");

// Attendance
replaceAny("app/(parent-portal)/parent/attendance/page.tsx", /students\.map\(async \(student\)/g, "students.map(async (student: any)");
replaceAny("app/(parent-portal)/parent/attendance/page.tsx", /attendance\.filter\(\(a\) =>/g, "attendance.filter((a: any) =>");
replaceAny("app/(parent-portal)/parent/attendance/page.tsx", /attendance\.filter\(\(a\)/g, "attendance.filter((a: any)");
replaceAny("app/(parent-portal)/parent/attendance/page.tsx", /attendance\.map\(\(record, i\)/g, "attendance.map((record: any, i: number)");

// Dashboard
replaceAny("app/(parent-portal)/parent/dashboard/page.tsx", /students\.map\(async \(student\)/g, "students.map(async (student: any)");

// Fees
replaceAny("app/(parent-portal)/parent/fees/page.tsx", /students\.map\(async \(student\)/g, "students.map(async (student: any)");
replaceAny("app/(parent-portal)/parent/fees/page.tsx", /invoices\.map\(\(inv\)/g, "invoices.map((inv: any)");
replaceAny("app/(parent-portal)/parent/fees/page.tsx", /payments\.map\(\(p, i\)/g, "payments.map((p: any, i: number)");

// Results
replaceAny("app/(parent-portal)/parent/results/page.tsx", /students\.map\(async \(student\)/g, "students.map(async (student: any)");
replaceAny("app/(parent-portal)/parent/results/page.tsx", /Object\.entries\(yearData\)\.map\(\(\[groupName, group\]\)/g, "Object.entries(yearData as any).map(([groupName, group]: any)");
replaceAny("app/(parent-portal)/parent/results/page.tsx", /group\.results\.map\(\(result\)/g, "group.results.map((result: any)");

// Students [id]
replaceAny("app/(parent-portal)/parent/students/[id]/page.tsx", /attendance\.filter\(\(a\)/g, "attendance.filter((a: any)");
replaceAny("app/(parent-portal)/parent/students/[id]/page.tsx", /timeline\.map\(\(event, i\)/g, "timeline.map((event: any, i: number)");
