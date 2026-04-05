const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(authenticate);

router.put('/me/avatar', userController.updateMyAvatar);
router.delete('/me/avatar', userController.removeMyAvatar);
router.get('/team-leaders', authorize('admin', 'team_leader'), userController.getTeamLeaders);
router.get('/team/:team', authorize('admin', 'team_leader'), userController.getEmployeesByTeam);
router.post('/move', authorize('admin'), userController.moveEmployee);
router.get('/', authorize('admin', 'team_leader'), userController.getAllUsers);
router.post('/', authorize('admin', 'team_leader'), userController.createUser);
router.post('/:id/reset-password', authorize('admin'), userController.adminResetUserPassword);
router.get('/:id', authorize('admin', 'team_leader'), userController.getUserById);
router.put('/:id', authorize('admin', 'team_leader'), userController.updateUser);
router.delete('/:id', authorize('admin', 'team_leader'), userController.deleteUser);

module.exports = router;