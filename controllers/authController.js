const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

// Load RSA private key for signing tokens
const getPrivateKey = () => {
  const privateKeyPath = path.join(__dirname, '../keys/private.pem');
  return require('fs').readFileSync(privateKeyPath, 'utf8');
}; 

// Load RSA public key (for testing/API endpoints)
const getPublicKey = () => {
  const publicKeyPath = path.join(__dirname, '../keys/public.pem');
  return require('fs').readFileSync(publicKeyPath, 'utf8');
};

// Helper function to read users
const getUsers = async () => {
  const usersPath = path.join(__dirname, '../data/users/users.json');
  const data = await fs.readFile(usersPath, 'utf8');
  return JSON.parse(data);
};

// Helper function to save users
const saveUsers = async (users) => {
  const usersPath = path.join(__dirname, '../data/users/users.json');
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
};

// Register new user
// VULNERABLE: No input validation, allows role injection
const register = async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    
    if (!username || !email || !password) {
      return res.render('register', { 
        error: 'All fields are required',
        success: null,
        title: 'Register'
      });
    }

    const users = await getUsers();
    
    // Check if user already exists
    if (users.find(u => u.email === email || u.username === username)) {
      return res.render('register', { 
        error: 'User already exists',
        success: null,
        title: 'Register'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // VULNERABILITY 1: Role injection - accepts role from request body
    // Attacker can set role=admin during registration
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      email,
      password: hashedPassword,
      role, // VULNERABLE: No validation on role value
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await saveUsers(users);
    
    res.redirect('/auth/login?success=Registration successful');
  } catch (error) {
    res.render('register', { 
      error: 'Registration failed. Please try again.',
      success: null,
      title: 'Register'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.render('login', { 
        error: 'Email and password are required',
        success: null,
        title: 'Login'
      });
    }

    const users = await getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.render('login', { 
        error: 'Invalid email or password',
        success: null,
        title: 'Login'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.render('login', { 
        error: 'Invalid email or password',
        success: null,
        title: 'Login'
      });
    }

    // Generate JWT token using RS256 (RSA) with standard claims
    const token = jwt.sign(
      { 
        sub: user.id.toString(),
        email: user.email,
        role: user.role
      }, 
      getPrivateKey(), 
      { 
        algorithm: 'RS256',
        expiresIn: '24h',
        keyid: '1'
      }
    );

    // Check if this is an API request
    const isAPIRequest = req.headers.accept?.includes('application/json') || 
                         req.query.format === 'json' ||
                         req.body.format === 'json';
    
    if (isAPIRequest) {
      // VULNERABILITY 2: Information disclosure - exposes token in JSON
      return res.json({
        success: true,
        token: token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        tokenInfo: {
          algorithm: 'RS256',
          expiresIn: '24h'
        }
      });
    }

    // Set token in cookie for web requests
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.redirect('/flights');
  } catch (error) {
    res.render('login', { 
      error: 'Login failed. Please try again.',
      success: null,
      title: 'Login'
    });
  }
};

// Logout user
const logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
};

// Show login page
const showLogin = (req, res) => {
  const success = req.query.success;
  res.render('login', { 
    error: null, 
    success,
    title: 'Login' 
  });
};

// Show register page
const showRegister = (req, res) => {
  res.render('register', { 
    error: null,
    success: null,
    title: 'Register' 
  });
};

// VULNERABILITY 3: Public key exposure endpoint
// Exposes the public key which can be used for algorithm confusion attack
const getPublicKeyEndpoint = (req, res) => {
  try {
    const publicKey = getPublicKey();
    res.json({
      publicKey: publicKey,
      algorithm: 'RS256',
      keyType: 'RSA',
      note: 'Public key for JWT verification'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve public key' });
  }
};

module.exports = {
  register,
  login,
  logout,
  showLogin,
  showRegister,
  getPublicKeyEndpoint
};