const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

// Load RSA private key for signing tokens
const getPrivateKey = () => {
  const privateKeyPath = path.join(__dirname, '../keys/private.pem');
  return require('fs').readFileSync(privateKeyPath, 'utf8');
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

    // Create new user
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      email,
      password: hashedPassword,
      role,
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

    // Generate JWT token using RS256 (RSA)
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      getPrivateKey(),
      { 
        algorithm: 'RS256',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
      }
    );

    // Set token in cookie
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

module.exports = {
  register,
  login,
  logout,
  showLogin,
  showRegister
};

