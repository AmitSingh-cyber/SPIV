const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth');

// Apply auth lock to all endpoints
router.use(authMiddleware);

// Subjects & Timetable
router.get('/subjects', studentController.getSubjects);
router.post('/subjects', studentController.createSubject);
router.get('/timetable', studentController.getTimetable);
router.post('/timetable', studentController.createTimetableEntry);

// Attendance
router.get('/attendance', studentController.getAttendanceSummary);
router.post('/attendance', studentController.logAttendance);

// Assignments
router.get('/assignments', studentController.getAssignments);
router.post('/assignments', studentController.createAssignment);
router.put('/assignments/:id', studentController.updateAssignment);

// Projects
router.get('/projects', studentController.getProjects);
router.post('/projects', studentController.createProject);
router.put('/projects/:id', studentController.updateProject);

// Certificates
router.get('/certificates', studentController.getCertificates);
router.post('/certificates', studentController.createCertificate);

// Password Vault
router.get('/passwords', studentController.getPasswords);
router.post('/passwords', studentController.createPassword);
router.delete('/passwords/:id', studentController.deletePassword);

// Todos & Tasks
router.get('/todos', studentController.getTodos);
router.post('/todos', studentController.createTodo);
router.put('/todos/:id', studentController.updateTodo);
router.delete('/todos/:id', studentController.deleteTodo);

// Profile & Feed
router.put('/profile', studentController.updateProfile);
router.get('/activity', studentController.getGlobalHistory);

// Host Admin operations
router.get('/admin/overview', studentController.getAdminOverview);
router.get('/admin/student/:id', studentController.getAdminStudentDetail);

module.exports = router;
