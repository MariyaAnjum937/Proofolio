const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.midlleware');
const requireFacultyBranch = require('../middlewares/facultyBranch.middleware');
const mentoringController = require('../controllers/mentoring.controllers');

const router = express.Router();

router.get('/faculty/mentoring/students/search', authMiddleware, authorizeRoles('faculty'), requireFacultyBranch, mentoringController.searchStudents);
router.post('/faculty/mentoring/mentees/:studentId', authMiddleware, authorizeRoles('faculty'), requireFacultyBranch, mentoringController.startMentoring);
router.patch('/faculty/mentoring/mentees/:studentId', authMiddleware, authorizeRoles('faculty'), requireFacultyBranch, mentoringController.endMentoring);
router.get('/faculty/mentoring/students', authMiddleware, authorizeRoles('faculty'), requireFacultyBranch, mentoringController.getAssignedStudents);
router.get('/faculty/mentoring/history', authMiddleware, authorizeRoles('faculty'), requireFacultyBranch, mentoringController.getPreviousAssignmentSessions);
router.get('/faculty/mentoring/students/:studentId', authMiddleware, authorizeRoles('faculty'), requireFacultyBranch, mentoringController.getStudentMentoringProfile);
router.get('/faculty/mentoring/students/:studentId/sessions', authMiddleware, authorizeRoles('faculty'), requireFacultyBranch, mentoringController.getStudentSessions);
router.post('/faculty/mentoring/sessions', authMiddleware, authorizeRoles('faculty'), requireFacultyBranch, mentoringController.createSession);
router.get('/faculty/mentoring/sessions/:sessionId', authMiddleware, authorizeRoles('faculty'), requireFacultyBranch, mentoringController.getSession);
router.patch('/faculty/mentoring/sessions/:sessionId', authMiddleware, authorizeRoles('faculty'), requireFacultyBranch, mentoringController.updateSession);
router.patch('/faculty/mentoring/sessions/:sessionId/report', authMiddleware, authorizeRoles('faculty'), requireFacultyBranch, mentoringController.updateSessionReport);
router.patch('/faculty/mentoring/sessions/:sessionId/cancel', authMiddleware, authorizeRoles('faculty'), requireFacultyBranch, mentoringController.cancelSession);
router.patch('/faculty/mentoring/sessions/:sessionId/action-items/:actionItemId', authMiddleware, authorizeRoles('faculty'), requireFacultyBranch, mentoringController.updateActionItem);
router.post('/faculty/mentoring/sessions/:sessionId/goals', authMiddleware, authorizeRoles('faculty'), requireFacultyBranch, mentoringController.createGoal);
router.patch('/faculty/mentoring/sessions/:sessionId/goals/:goalId', authMiddleware, authorizeRoles('faculty'), requireFacultyBranch, mentoringController.updateGoal);

router.get('/student/mentoring/mentors', authMiddleware, authorizeRoles('student'), mentoringController.getStudentMentors);
router.get('/student/mentoring/sessions', authMiddleware, authorizeRoles('student'), mentoringController.getOwnStudentSessions);
router.patch('/student/mentoring/sessions/:sessionId/action-items/:actionItemId', authMiddleware, authorizeRoles('student'), mentoringController.updateStudentActionItem);
router.get('/notifications', authMiddleware, authorizeRoles('student', 'faculty'), mentoringController.listNotifications);
router.patch('/notifications/:notificationId/read', authMiddleware, authorizeRoles('student', 'faculty'), mentoringController.markNotificationRead);

module.exports = router;
