const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/login',
  [body('email').isEmail(), body('password').isString().notEmpty()],
  authController.login
);
router.get('/me', authenticate, authController.getCurrentUser);
router.post(
  '/change-password',
  authenticate,
  [body('currentPassword').isString().notEmpty(), body('newPassword').isString().isLength({ min: 6 })],
  authController.changePassword
);

module.exports = router;