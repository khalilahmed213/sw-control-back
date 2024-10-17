const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET all schedules
router.get('/', scheduleController.getAllSchedules);

// POST create a new schedule
router.post('/', scheduleController.createSchedule);

// PUT update a schedule
router.put('/:id', scheduleController.updateSchedule);

// DELETE delete a schedule
router.delete('/:id', scheduleController.deleteSchedule);

// PUT toggle isSelected for a schedule
router.get('/getisselectedschedule',scheduleController.getCurrentSchedule)
router.get('/getrecuring',scheduleController.checkIfScheduleIsRecurring)

module.exports = router;