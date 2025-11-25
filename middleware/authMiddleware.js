const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

// Load RSA public key for verifying tokens
const getPublicKey = () => {
  const publicKeyPath = path.join(__dirname, '../keys/public.pem');
  return require('fs').readFileSync(publicKeyPath, 'utf8');
};

// Verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).render('error', { 
      message: 'Access denied. No token provided.',
      title: 'Access Denied'
    });
  }

  try {
    const decoded = jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] });
    req.user = decoded;
    next();
  } catch (error) {
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
    
    const user = users.find(u => u.id === req.user.userId);
    
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

