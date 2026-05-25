const fs = require("fs");

let dal = fs.readFileSync("lib/dal/parent-portal.ts", "utf-8");

// Revert all to isActive: true
dal = dal.replace(/status: 'ACTIVE'/g, "isActive: true");

// Fix enrollments explicitly
dal = dal.replace(/enrollments: {\s*where: { isActive: true },/g, "enrollments: { where: { status: 'ACTIVE' },");

fs.writeFileSync("lib/dal/parent-portal.ts", dal);
