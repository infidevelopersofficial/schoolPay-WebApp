const fs = require('fs');

const filesToFix = [
  'app/(dashboard)/settings/billing/checkout-button.tsx',
  'app/(dashboard)/settings/billing/page.tsx',
  'app/api/billing/sync-usage/route.ts',
  'components/billing/grace-period-banner.tsx',
  'lib/billing/limits.ts',
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\\\`/g, '`');
  fs.writeFileSync(file, content);
}

// Fix the MarkAttendanceForm import
const formIndex = 'components/forms/index.tsx';
let formContent = fs.readFileSync(formIndex, 'utf8');
formContent = formContent.replace('export { MarkAttendanceForm } from "./mark-attendance-form"\n', '');
fs.writeFileSync(formIndex, formContent);

const allForms = 'components/forms/all-forms.tsx';
let allContent = fs.readFileSync(allForms, 'utf8');
allContent = allContent.replace('import { MarkAttendanceForm } from "./mark-attendance-form"\n', '');
fs.writeFileSync(allForms, allContent);

console.log('Fixed escaped backticks and mark-attendance-form imports');
