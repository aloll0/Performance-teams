const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const teamController = require('../controllers/teamController');

const router = express.Router();

router.use(authenticate);

router.get('/stats/:teamName', authorize('admin', 'team_leader'), teamController.getTeamStats);
router.get('/', authorize('admin', 'team_leader'), teamController.getAllTeams);
router.post('/', authorize('admin'), teamController.createTeam);
router.get('/:id', authorize('admin', 'team_leader'), teamController.getTeamById);
router.put('/:id', authorize('admin'), teamController.updateTeam);
router.delete('/:id', authorize('admin'), teamController.deleteTeam);

module.exports = router;