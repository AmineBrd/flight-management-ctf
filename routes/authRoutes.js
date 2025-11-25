const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Show login page
router.get('/login', authController.showLogin);

// Show register page
router.get('/register', authController.showRegister);

// Register new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Logout user
router.get('/logout', authController.logout);

module.exports = router;

