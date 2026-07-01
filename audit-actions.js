const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const unauthenticatedFiles = [];
const partiallyAuthenticatedFiles = [];

walkDir('./app', function(filePath) {
  if (filePath.endsWith('actions.ts')) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('"use server"') && !content.includes("'use server'")) {
      return; // Not a server action file
    }

    // Is it an auth/onboarding/webhook route? These don't use withTenantAuth
    if (filePath.includes('app\\(auth)') || filePath.includes('app/(auth)') || 
        filePath.includes('app\\api') || filePath.includes('app/api') ||
        filePath.includes('app\\(marketing)') || filePath.includes('app/(marketing)') ||
        filePath.includes('app\\super-admin') || filePath.includes('app/super-admin') ||
        filePath.includes('app\\(parent-portal)') || filePath.includes('app/(parent-portal)') ||
        filePath.includes('app\\(student-portal)') || filePath.includes('app/(student-portal)')) {
      return;
    }

    if (!content.includes('withTenantAuth')) {
      unauthenticatedFiles.push(filePath);
    } else {
      // It has withTenantAuth, but let's check if all exports use it
      const matches = content.match(/export async function (\w+)/g);
      if (matches) {
        let hasUnprotected = false;
        const functionNames = matches.map(m => m.split(' ')[3]);
        
        // Simple heuristic: if export async function is used, is withTenantAuth inside it?
        // Actually this is hard to parse precisely without AST. We'll just flag files 
        // that use `export async function` AND `withTenantAuth`, because our standard 
        // pattern is `export const myAction = withTenantAuth(...)` OR `return withTenantAuth(...)`.
        // Let's just output it to review manually.
        partiallyAuthenticatedFiles.push({
          file: filePath,
          funcs: functionNames
        });
      }
    }
  }
});

console.log("=== FILES MISSING WITHTENANTAUTH ENTIRELY ===");
unauthenticatedFiles.forEach(f => console.log(f));

console.log("\n=== FILES WITH BOTH EXPORT ASYNC FUNCTION AND WITHTENANTAUTH (MANUAL REVIEW) ===");
partiallyAuthenticatedFiles.forEach(f => console.log(`${f.file}: ${f.funcs.join(', ')}`));
