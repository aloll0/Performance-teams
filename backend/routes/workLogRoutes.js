const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const workLogController = require('../controllers/workLogController');

const router = express.Router();

router.use(authenticate);

router.get('/me', authorize('employee'), workLogController.getMyWorkLogs);
router.post('/me', authorize('employee'), workLogController.submitMyWorkLog);

router.get('/team', authorize('admin', 'team_leader'), workLogController.getTeamWorkLogs);
router.put('/:id/review', authorize('admin', 'team_leader'), workLogController.reviewWorkLog);

module.exports = router;
