const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controllers');
const authMiddleware = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.midlleware');

router.post('/auth/sign-up', authController.registerUser);
router.post('/auth/register/student', authController.registerStudent);
router.post('/auth/register/faculty', authController.registerFaculty);
router.post('/auth/register/admin', authController.registerAdmin);
router.post('/auth/sign-in', authController.loginUser);
router.post('/auth/sign-out', authController.logoutUser);

router.get('/student/profile', authMiddleware, authorizeRoles('student'), authController.getStudentProfile);
router.patch('/student/profile', authMiddleware, authorizeRoles('student'), authController.updateStudentProfile);

router.get('/admin/faculty/pending', authMiddleware, authorizeRoles('admin'), authController.getPendingFaculty);
router.patch('/admin/faculty/:id/approve', authMiddleware, authorizeRoles('admin'), authController.approveFaculty);
router.patch('/admin/faculty/:id/reject', authMiddleware, authorizeRoles('admin'), authController.rejectFaculty);

module.exports = router;