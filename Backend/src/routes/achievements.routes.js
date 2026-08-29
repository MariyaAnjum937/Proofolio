const express = require('express');
const router = express.Router();
const achController = require('../controllers/achievements.controllers')
const authMiddleware = require('../middlewares/auth.middleware');
const upload = require("../middlewares/upload.middleware");

router.post(
    '/achievements/create',
    authMiddleware,
    upload.single('certificate'),
    achController.postAchievement
);
router.get('/achievements/get',authMiddleware, achController.displayAchievements);
router.delete("/delete/:id", achController.deleteAchievement);

module.exports = router;