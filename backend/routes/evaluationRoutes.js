const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const evaluationController = require('../controllers/evaluationController');

const router = express.Router();

router.use(authenticate);

router.get('/employee/:employeeId/history', authorize('admin', 'team_leader', 'employee'), evaluationController.getEmployeeEvaluationHistory);
router.get('/employee/:employeeId/stats', authorize('admin', 'team_leader', 'employee'), evaluationController.getEmployeeStats);
router.post('/', authorize('admin', 'team_leader'), evaluationController.createOrUpdateEvaluation);
router.get('/', authorize('admin', 'team_leader'), evaluationController.getAllEvaluations);
router.get('/:id', authorize('admin', 'team_leader'), evaluationController.getEvaluationById);

module.exports = router;