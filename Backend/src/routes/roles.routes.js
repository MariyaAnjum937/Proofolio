const express = require('express');
const router = express.Router();
const authorizeRoles = require('../middlewares/role.midlleware');
const authMiddleware = require('../middlewares/auth.middleware');
const roleController = require('../controllers/role.controller');


router.post('/role/student', 
    authMiddleware, 
    authorizeRoles("student", "faculty", "admin"),
    roleController.studentRole
);
router.post('/role/faculty',
    authMiddleware, 
    authorizeRoles("faculty", "admin"),
    roleController.facultyRole
);
router.post('/role/admin', 
    authMiddleware, 
    authorizeRoles("admin"),
    roleController.adminRole
);

router.get('/admin/overview',
    authMiddleware,
    authorizeRoles("admin"),
    roleController.getAdminOverview
);

router.get('/admin/students',
    authMiddleware,
    authorizeRoles("admin"),
    roleController.getAdminStudents
);

router.get('/admin/students/:id',
    authMiddleware,
    authorizeRoles("admin"),
    roleController.getAdminStudentDetails
);

router.get('/admin/certificates',
    authMiddleware,
    authorizeRoles("admin"),
    roleController.getAdminCertificates
);

router.get('/admin/student-certificates',
    authMiddleware,
    authorizeRoles("admin"),
    roleController.getAdminStudentCertificates
);

router.get('/admin/faculty-certificates',
    authMiddleware,
    authorizeRoles("admin"),
    roleController.getAdminFacultyCertificates
);

module.exports = router;