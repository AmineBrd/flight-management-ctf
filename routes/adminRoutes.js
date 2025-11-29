const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const flightController = require('../controllers/flightController');
const reportController = require('../controllers/reportController');

// All admin routes require authentication and admin privileges
router.use(verifyToken);
router.use(isAdmin);

// Get all flights (admin view)
router.get('/flights', flightController.getAllFlightsAdmin);

// Get flight by ID (admin view)
router.get('/flights/:id', flightController.getFlightByIdAdmin);

// Create new flight (admin only)
router.post('/flights', flightController.createFlight);

// Update flight (admin only)
router.put('/flights/:id', flightController.updateFlight);

// Delete flight (admin only)
router.delete('/flights/:id', flightController.deleteFlight);

// Reports routes
router.get('/reports', reportController.getReports);
router.post('/reports/upload', reportController.uploadReport);
router.delete('/reports/:filename', reportController.deleteReport);

module.exports = router;

