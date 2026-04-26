const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const learningCourseController = require('../controllers/learningCourseController');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'team_leader', 'employee'), learningCourseController.getCourses);
router.post('/', authorize('admin', 'team_leader'), learningCourseController.createCourse);
router.post('/:id/videos', authorize('admin', 'team_leader'), learningCourseController.addCourseVideo);
router.delete('/:id/videos/:videoId', authorize('admin', 'team_leader'), learningCourseController.removeCourseVideo);
router.put('/:id/completion', authorize('admin', 'team_leader', 'employee'), learningCourseController.updateCompletion);
router.delete('/:id', authorize('admin', 'team_leader'), learningCourseController.deleteCourse);

module.exports = router;
