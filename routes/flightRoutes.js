const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const flightController = require('../controllers/flightController');

// All flight routes require authentication (user routes only)
router.use(verifyToken);

// Get all flights (user view)
router.get('/', flightController.getAllFlights);

// Get flight by ID (user view)
router.get('/:id', flightController.getFlightById);

module.exports = router;

