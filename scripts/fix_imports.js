const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const dirs = ['components', 'scripts', 'app'];

dirs.forEach(d => {
  walkDir(path.join(__dirname, '..', d), function(filePath) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      let newContent = content.replace(/@\/app\/\(dashboard\)\//g, '@/app/app/');
      newContent = newContent.replace(/\.\.\/app\/\(dashboard\)\//g, '../app/app/');
      newContent = newContent.replace(/\.\.\/\.\.\/app\/\(dashboard\)\//g, '../../app/app/');

      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed imports in: ' + filePath);
      }
    }
  });
});
