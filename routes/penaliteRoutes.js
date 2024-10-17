const express = require('express');
const router = express.Router();
const penaliteController = require('../controllers/penaliteController');
const authMiddleware = require('../middleware/authMiddleware'); // Import auth middleware

// Apply auth middleware to all routes in this router
router.use(authMiddleware);
router.post('/penalites', penaliteController.createPenalite);
router.get('/penalites', penaliteController.getPenalites);
router.put('/penalites/:id', penaliteController.updatePenalite);
router.delete('/penalites/:id', penaliteController.deletePenalite);

module.exports = router;