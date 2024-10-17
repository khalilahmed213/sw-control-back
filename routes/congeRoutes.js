const express = require('express');
const router = express.Router();
const congeController = require('../controllers/congeController');
const authMiddleware = require('../middleware/authMiddleware'); // Import auth middleware

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// Create a new conge
router.post('/conges', congeController.createConge);

// Get all conges
router.get('/conges', congeController.getAllConges);

// Update a conge
router.put('/conges/:id', congeController.updateConge);

// Delete a conge
router.delete('/conges/:id', congeController.deleteConge);

// Get conges for a specific user
router.get('/conge', congeController.getUserConges);
router.put('/conge/:id', congeController.toggleCongeStatus);

module.exports = router;
