const fs = require('fs');
let sql = fs.readFileSync('scratch/phase6b.sql', 'utf16le');
fs.writeFileSync('scratch/phase6b.sql', sql, 'utf8');
