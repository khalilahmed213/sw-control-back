const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
router.post('/login', authController.login);
router.patch('/forgotPassword', authController.forgotPassword); 
router.put('/resetPassword/:token', authController.resetPassword);
module.exports = router;