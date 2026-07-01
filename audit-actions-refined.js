const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const unprotectedActions = [];

walkDir('./app', function(filePath) {
  if (filePath.endsWith('actions.ts')) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('"use server"') && !content.includes("'use server'")) return;

    if (filePath.replace(/\\/g, '/').match(/app\/(api|\(auth\)|\(marketing\)|super-admin|\(parent-portal\)|\(student-portal\))/)) return;

    // Simple regex to match export async function blocks roughly
    // We will look for "export async function XYZ" and find the matching closing brace.
    // Since regex for balanced braces is hard, we can just split by "export async function" 
    // and check the text up to the next "export async function" or end of file.
    
    const chunks = content.split('export async function ');
    // chunks[0] is the imports/header
    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];
      const funcName = chunk.substring(0, chunk.indexOf('(')).trim();
      
      // If the function body doesn't invoke withTenantAuth or withSystemContext
      if (!chunk.includes('withTenantAuth(') && !chunk.includes('withSystemContext(')) {
        unprotectedActions.push({ file: filePath, func: funcName });
      }
    }
    
    // Also check for `export const xxx = async () =>` that might miss it
    const constChunks = content.split('export const ');
    for (let i = 1; i < constChunks.length; i++) {
      const chunk = constChunks[i];
      if (chunk.includes(' = async (') || chunk.includes(' = async ()')) {
        const funcName = chunk.substring(0, chunk.indexOf('=')).trim();
        if (!chunk.includes('withTenantAuth(') && !chunk.includes('withSystemContext(')) {
          unprotectedActions.push({ file: filePath, func: funcName });
        }
      }
    }
  }
});

const grouped = {};
unprotectedActions.forEach(a => {
  if (!grouped[a.file]) grouped[a.file] = [];
  grouped[a.file].push(a.func);
});

console.log(JSON.stringify(grouped, null, 2));
