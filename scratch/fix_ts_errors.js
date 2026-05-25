const fs = require("fs");

// 1. Fix fees actions
let actions = fs.readFileSync("app/(parent-portal)/parent/fees/actions.ts", "utf-8");
actions = actions.replace(/invoiceId: invoice.id,/g, 'metadata: { invoiceId: invoice.id },');
fs.writeFileSync("app/(parent-portal)/parent/fees/actions.ts", actions);

// 2. Fix parent-portal DAL schema errors
let dal = fs.readFileSync("lib/dal/parent-portal.ts", "utf-8");
dal = dal.replace(/isActive: true/g, "status: 'ACTIVE'");
dal = dal.replace(/academicYear: true/g, "session: true");
dal = dal.replace(/academicYear:/g, "session:");
dal = dal.replace(/term: true, /g, "");
fs.writeFileSync("lib/dal/parent-portal.ts", dal);

// 3. Fix results page
let results = fs.readFileSync("app/(parent-portal)/parent/results/page.tsx", "utf-8");
results = results.replace(/result\.exam\.examGroup\?\.academicYear\?\.name/g, "result.exam.examGroup?.session?.name");
results = results.replace(/const termName = result\.exam\.examGroup\?\.term \|\| "";/g, 'const termName = "";');
fs.writeFileSync("app/(parent-portal)/parent/results/page.tsx", results);

// 4. Fix student profile page
let profile = fs.readFileSync("app/(parent-portal)/parent/students/[id]/page.tsx", "utf-8");
profile = profile.replace(/academicYear/g, "session");
fs.writeFileSync("app/(parent-portal)/parent/students/[id]/page.tsx", profile);
