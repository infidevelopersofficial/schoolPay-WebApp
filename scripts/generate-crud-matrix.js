const fs = require('fs');
const path = require('path');

const modules = [
  'students', 'teachers', 'parents', 'classes', 'subjects', 
  'lessons', 'attendance', 'fees', 'payments', 'results', 
  'events', 'messages', 'communications'
];

const dalDir = path.join(__dirname, 'lib/dal');
let matrix = `| Module | Create | Read | Update | Delete | Status |\n| ------ | ------ | ---- | ------ | ------ | ------ |\n`;

for (const mod of modules) {
  let hasCreate = false, hasRead = false, hasUpdate = false, hasDelete = false;
  
  const dalPath = path.join(dalDir, `${mod}.ts`);
  if (fs.existsSync(dalPath)) {
    const content = fs.readFileSync(dalPath, 'utf8');
    if (content.match(/function create/i) || content.match(/function add/i)) hasCreate = true;
    if (content.match(/function get/i) || content.match(/function find/i)) hasRead = true;
    if (content.match(/function update/i) || content.match(/function edit/i)) hasUpdate = true;
    if (content.match(/function delete/i) || content.match(/function remove/i)) hasDelete = true;
  }
  
  if (mod === 'communications') {
     const cPath = path.join(dalDir, `campaigns.ts`);
     if (fs.existsSync(cPath)) {
        const c = fs.readFileSync(cPath, 'utf8');
        if (c.match(/function create/i)) hasCreate = true;
        if (c.match(/function get/i)) hasRead = true;
        if (c.match(/function update/i)) hasUpdate = true;
        if (c.match(/function delete/i)) hasDelete = true;
     }
  }

  const score = [hasCreate, hasRead, hasUpdate, hasDelete].filter(Boolean).length;
  let status = 'Incomplete';
  if (score === 4) status = 'Complete';
  else if (score >= 2) status = 'Partial';
  
  matrix += `| ${mod.charAt(0).toUpperCase() + mod.slice(1)} | ${hasCreate?'Yes':'No'} | ${hasRead?'Yes':'No'} | ${hasUpdate?'Yes':'No'} | ${hasDelete?'Yes':'No'} | ${status} |\n`;
}

fs.writeFileSync('crud-matrix.md', matrix);
