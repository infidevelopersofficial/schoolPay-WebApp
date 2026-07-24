const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('node_modules/react-resizable-panels/package.json', 'utf8'));
console.log('NAME:', pkg.name);
console.log('VERSION:', pkg.version);
console.log('HOMEPAGE:', pkg.homepage);
console.log('REPOSITORY:', pkg.repository);
