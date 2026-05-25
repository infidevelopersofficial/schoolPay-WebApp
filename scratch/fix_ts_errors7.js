const fs = require("fs");

// Fix Results
let results = fs.readFileSync("app/(parent-portal)/parent/results/page.tsx", "utf-8");
results = results.replace(/Object\.entries\(groups\)\.map/g, "Object.entries(groups as any).map");
results = results.replace(/group\.results\.map\(\(result\) =>/g, "group.results.map((result: any) =>");
fs.writeFileSync("app/(parent-portal)/parent/results/page.tsx", results);

// Fix Students
let profile = fs.readFileSync("app/(parent-portal)/parent/students/[id]/page.tsx", "utf-8");
profile = profile.replace(/attendance\.filter\(\(a\) =>/g, "attendance.filter((a: any) =>");
fs.writeFileSync("app/(parent-portal)/parent/students/[id]/page.tsx", profile);
