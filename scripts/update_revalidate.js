const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, '..', 'app', 'app'), function(filePath) {
  if (filePath.endsWith('actions.ts') || filePath.endsWith('portal-actions.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace revalidatePath("/") with revalidatePath("/app")
    content = content.replace(/revalidatePath\("\/"\)/g, 'revalidatePath("/app")');
    
    // Replace revalidatePath("/path") with revalidatePath("/app/path")
    content = content.replace(/revalidatePath\("\/([a-zA-Z0-9-]+)"\)/g, 'revalidatePath("/app/$1")');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated: ' + filePath);
  }
});
