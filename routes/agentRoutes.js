const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const authMiddleware = require('../middleware/authMiddleware');
// Apply auth middleware to all routes
router.use(authMiddleware);
router.get('/', authMiddleware, agentController.getAgents);
router.post('/', authMiddleware, agentController.createAgent);
router.put('/:id', authMiddleware, agentController.updateAgent);
router.delete('/:id', authMiddleware, agentController.deleteAgent);
router.post('/:id/reset-password', authMiddleware, agentController.resetPassword);
// Add the new route for getAllEmployees
router.get('/allagents',authMiddleware, agentController.getAllEmployees);

module.exports = router;