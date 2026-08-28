const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controllers')

router.post('/auth/sign-up', authController.registerUser);
router.post('/auth/sign-in', authController.loginUser);


module.exports = router;