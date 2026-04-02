const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', authorize('admin', 'team_leader'), analyticsController.getDashboardAnalytics);
router.get('/team-leaders', authorize('admin'), analyticsController.getTeamLeaderPerformance);
router.get('/team/:teamName', authorize('admin', 'team_leader'), analyticsController.getTeamAnalytics);

module.exports = router;