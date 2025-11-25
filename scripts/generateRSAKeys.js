const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Create keys directory if it doesn't exist
const keysDir = path.join(__dirname, '../keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// Generate RSA key pair
// 2048-bit key size (minimum recommended for RS256)
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Write keys to files
const privateKeyPath = path.join(keysDir, 'private.pem');
const publicKeyPath = path.join(keysDir, 'public.pem');

fs.writeFileSync(privateKeyPath, privateKey, 'utf8');
fs.writeFileSync(publicKeyPath, publicKey, 'utf8');

console.log('✅ RSA key pair generated successfully!');
console.log(`📁 Private key saved to: ${privateKeyPath}`);
console.log(`📁 Public key saved to: ${publicKeyPath}`);
console.log('\n🔐 Key Details:');
console.log(`   Algorithm: RSA`);
console.log(`   Key Size: 2048 bits`);
console.log(`   Format: PEM`);
console.log('\n⚠️  IMPORTANT: Keep the private key secure and never commit it to version control!');
console.log('   Add keys/ directory to .gitignore if not already present.');

