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




module.exports = router;