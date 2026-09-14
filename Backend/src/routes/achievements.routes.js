const express = require('express');
const router = express.Router();
const achController = require('../controllers/achievements.controllers')
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.midlleware');
const upload = require("../middlewares/upload.middleware");

router.post(
    '/achievements/create',
    authMiddleware,
    roleMiddleware("student"),
    upload.single('certificate'),
    achController.postAchievement
);
router.get('/achievements/get',
    authMiddleware,
    roleMiddleware("student", "faculty", "admin"),
    achController.displayAchievements
);

router.delete("/delete/:id",
    authMiddleware,
    roleMiddleware("student"),
    achController.deleteAchievement
);

router.get( "/achievements/pending", 
    authMiddleware, 
    roleMiddleware("faculty"), 
    achController.getPendingAchievements
);

router.patch( "/achievements/:id/verify", 
    authMiddleware, 
    roleMiddleware("faculty"), 
    achController.verifyAchievement
);

module.exports = router;