const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const quizController = require('../controllers/quizController');

const router = express.Router();

router.use(authenticate);

router.get('/results/all', authorize('admin', 'team_leader'), quizController.getAllQuizResults);
router.get('/results/user/:userId', authorize('admin', 'team_leader', 'employee'), quizController.getUserQuizResults);
router.post('/:id/submit', authorize('admin', 'team_leader', 'employee'), quizController.submitQuiz);
router.get('/', authorize('admin', 'team_leader', 'employee'), quizController.getAllQuizzes);
router.get('/:id', authorize('admin', 'team_leader', 'employee'), quizController.getQuizById);
router.post('/', authorize('admin', 'team_leader'), quizController.createQuiz);
router.put('/:id', authorize('admin', 'team_leader'), quizController.updateQuiz);
router.delete('/:id', authorize('admin', 'team_leader'), quizController.deleteQuiz);

module.exports = router;