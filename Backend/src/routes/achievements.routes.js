const express = require('express');
const router = express.Router();
const achController = require('../controllers/achievements.controllers')
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.midlleware');
const upload = require("../middlewares/upload.middleware");
const facultyController = require('../controllers/faculty.controllers');

router.get('/faculty/students', authMiddleware, roleMiddleware("faculty"), facultyController.listStudents);
router.get('/faculty/students/:studentId', authMiddleware, roleMiddleware("faculty"), facultyController.getStudentDetails);
router.get('/faculty/students/:studentId/certificates', authMiddleware, roleMiddleware("faculty"), facultyController.getStudentCertificates);
router.get('/faculty/student-certificates/:certificateId', authMiddleware, roleMiddleware("faculty"), facultyController.getStudentCertificate);
router.get('/faculty/student-certificates', authMiddleware, roleMiddleware("faculty"), facultyController.getStudentCertificates);
router.get('/faculty/profile', authMiddleware, roleMiddleware("faculty"), facultyController.getMyProfile);
router.get('/faculty/my-certificates', authMiddleware, roleMiddleware("faculty"), facultyController.getMyCertificates);
router.post(
    '/faculty/my-certificates',
    authMiddleware,
    roleMiddleware("faculty"),
    upload.single('certificate'),
    facultyController.createMyCertificate
);
router.patch('/faculty/my-certificates/:certificateId', authMiddleware, roleMiddleware("faculty"), facultyController.updateMyCertificate);

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

router.patch( "/achievements/:id/reject", 
    authMiddleware, 
    roleMiddleware("faculty"), 
    achController.rejectAchievement
);

module.exports = router;