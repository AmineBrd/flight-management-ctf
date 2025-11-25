const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const flightController = require('../controllers/flightController');

// All flight routes require authentication
router.use(verifyToken);

// Get all flights
router.get('/', flightController.getAllFlights);

// Get flight by ID
router.get('/:id', flightController.getFlightById);

// Create new flight (admin only)
router.post('/', isAdmin, flightController.createFlight);

// Update flight (admin only)
router.put('/:id', isAdmin, flightController.updateFlight);

// Delete flight (admin only)
router.delete('/:id', isAdmin, flightController.deleteFlight);

module.exports = router;

