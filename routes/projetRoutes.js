const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/projetController');
const authMiddleware = require('../middleware/authMiddleware'); // Import auth middleware

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// Define routes
router.get('/', ProjectController.getAllProjects);
router.post('/', ProjectController.createProject);
router.put('/:id', ProjectController.updateProject);
router.delete('/:id', ProjectController.deleteProject);

module.exports = router;