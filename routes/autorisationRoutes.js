const express = require('express');
const router = express.Router();
const autorisationController = require('../controllers/autorisationController');
const authMiddleware = require('../middleware/authMiddleware'); // Import auth middleware

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// Create a new autorisation
router.post('/autorisations', autorisationController.createAutorisation);

// Get all autorisations
router.get('/autorisations', autorisationController.getAllAutorisations);

// Update an autorisation
router.put('/autorisations/:id', autorisationController.updateAutorisation);

// Delete an autorisation
router.delete('/autorisations/:id', autorisationController.deleteAutorisation);

// Get autorisations for a specific user
router.get('/autorisation', autorisationController.getAllAutorisations);
router.put('/autorisation/:id', autorisationController.toggleAutorisationStatus);
module.exports = router;