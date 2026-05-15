const bcrypt = require('bcryptjs');

async function generateHashes() {
  const passwords = {
    'student123': await bcrypt.hash('student123', 12),
    'teacher123': await bcrypt.hash('teacher123', 12),
    'parent123': await bcrypt.hash('parent123', 12),
  };
  
  console.log(JSON.stringify(passwords, null, 2));
}

generateHashes();
