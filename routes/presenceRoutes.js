const express = require('express');
const router = express.Router();
const presenceController = require('../controllers/presenceController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);
// Route to update presence or record absence
router.post('/presence', presenceController.updatePresence);

// Route to add presence
router.post('/presence/add', presenceController.addPresence);

// Route to get today's presence and absence
router.get('/presence/fetch', presenceController.getPresenceAndAbsence);

module.exports = router;