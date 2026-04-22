const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const learningCourseController = require('../controllers/learningCourseController');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'team_leader', 'employee'), learningCourseController.getCourses);
router.post('/', authorize('admin', 'team_leader'), learningCourseController.createCourse);
router.put('/:id/completion', authorize('admin', 'team_leader', 'employee'), learningCourseController.updateCompletion);
router.delete('/:id', authorize('admin', 'team_leader'), learningCourseController.deleteCourse);

module.exports = router;
