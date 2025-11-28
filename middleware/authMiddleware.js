const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

// Load RSA keys
const keys = {
  private: require('fs').readFileSync(path.join(__dirname, '../keys/private.pem'), 'utf8'),
  public: require('fs').readFileSync(path.join(__dirname, '../keys/public.pem'), 'utf8')
};

const formatKey = (key) => {
  return (
    key
      .replace(/\\n/g, '\n')
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s+/g, '')
      .match(/.{1,64}/g)
      .join('\n')
  );
};
// JWKS-style key getter function
// VULNERABILITY: This function allows mixed algorithms and uses public key as HMAC secret
const getKey = (header, callback) => {
  // For RS256, return the public key
  if (header.alg === 'RS256') {
    return callback(null, keys.public);
  }
  // For HS256, VULNERABILITY: Use public key as HMAC secret
  if (header.alg === 'HS256') {
    console.log("formatKey(keys.public): ", formatKey(keys.public));
    return callback(null, formatKey(keys.public));
  }
  return callback(new Error('Unsupported algorithm'));
};

const verifyWithGetKey = (token, options) =>
  new Promise((resolve, reject) => {
    jwt.verify(token, getKey, options, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });

// Verify JWT token
// VULNERABLE: Algorithm confusion - accepts both RS256 and HS256
// This allows attackers to forge tokens by using the public key as HMAC secret
const verifyToken = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).render('error', { 
      message: 'Access denied. No token provided.',
      title: 'Access Denied'
    });
  }

  try {
    // Decode header (optional, but kept for basic validation)
    const decodedHeader = jwt.decode(token, { complete: true });
    console.log(decodedHeader);
    if (!decodedHeader) {
      return res.status(401).render('error', { 
        message: 'Invalid token format.',
        title: 'Access Denied'
      });
    }
    console.log("decodedHeader complete: ", decodedHeader.signature);
    // Single verify call with mixed algorithms allowed - this is the key vulnerability
    // Assumes getKey provides the public key; for HS256, it'll misuse it as secret
    const decoded = await verifyWithGetKey(token, {
      algorithms: ['RS256', 'HS256']  // Allows confusion by including symmetric alg
    });
    console.log("decoded: after checking algorithm confusion ", decoded);
    // Map sub to userId for backward compatibility
    if (decoded.sub && !decoded.userId) {
      decoded.userId = parseInt(decoded.sub);
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).render('error', { 
      message: 'Invalid or expired token.',
      title: 'Access Denied'
    });
  }
};

// Check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const usersPath = path.join(__dirname, '../data/users/users.json');
    const usersData = await fs.readFile(usersPath, 'utf8');
    const users = JSON.parse(usersData);
    
    // Handle both userId and sub (from new token format)
    const userId = req.user.userId || parseInt(req.user.sub);
    const user = users.find(u => u.id === userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).render('error', { 
        message: 'Access denied. Admin privileges required.',
        title: 'Access Denied'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).render('error', { 
      message: 'Error checking user permissions.',
      title: 'Error'
    });
  }
};

module.exports = { verifyToken, isAdmin };

