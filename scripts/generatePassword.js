const bcrypt = require('bcryptjs');

// Helper script to generate password hash
// Usage: node scripts/generatePassword.js <password>

const password = process.argv[2];

if (!password) {
  console.log('Usage: node scripts/generatePassword.js <password>');
  process.exit(1);
}

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  console.log('Password hash:', hash);
  console.log('\nYou can use this hash in data/users/users.json');
});

