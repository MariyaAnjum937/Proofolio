const express = require('express');
const router = express.Router();
const achController = require('../controllers/achievements.controllers')
const authMiddleware = require('../middlewares/auth.middleware');


router.post('/achievements/create',authMiddleware, achController.postAchievement);
router.get('/achievements/get',authMiddleware, achController.displayAchievements);


module.exports = router;