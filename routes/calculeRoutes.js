const express = require('express');
const router = express.Router();
const  calculeController = require('../controllers/calculeController');
const authMiddleware = require('../middleware/authMiddleware');
// Apply auth middleware to all routes
router.use(authMiddleware);
router.get('/absence', authMiddleware, calculeController.getAbsences);
router.get('/retard', authMiddleware, calculeController.getRetardData);
router.get('/congecalcule', authMiddleware, calculeController.calculateLeaveBalance);
router.get('/calculep', authMiddleware, calculeController.calculateLeaveBalanceForUser);
module.exports = router;