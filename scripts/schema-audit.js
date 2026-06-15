const fs = require('fs');

const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = schema.split('\\n');

let currentModel = null;
let models = [];

for (const line of lines) {
  const modelMatch = line.match(/^model\\s+(\\w+)/);
  if (modelMatch) {
    currentModel = { name: modelMatch[1], hasSchoolId: false, hasCompoundUnique: false };
    models.push(currentModel);
    continue;
  }
  
  if (currentModel) {
    if (line.includes('schoolId')) currentModel.hasSchoolId = true;
    if (line.includes('@@unique([') && line.includes('schoolId')) currentModel.hasCompoundUnique = true;
  }
}

console.log("| Model | Has schoolId | Compound Unique | Protected |");
console.log("|-------|--------------|-----------------|-----------|");
for (const m of models) {
  const isGlobal = !m.hasSchoolId;
  const protected = isGlobal ? 'Global' : 'Yes (Middleware)';
  console.log(`| ${m.name} | ${m.hasSchoolId ? 'Yes' : 'No'} | ${m.hasCompoundUnique ? 'Yes' : 'No'} | ${protected} |`);
}
