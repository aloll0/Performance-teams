const express = require('express');
const { body, param } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/login',
  [body('email').isEmail(), body('password').isString().notEmpty()],
  authController.login
);
router.post('/qr-token', authController.createQrToken);
router.get(
  '/qr-status/:token',
  [param('token').isUUID().withMessage('QR token must be a valid UUID')],
  authController.getQrTokenStatus
);
router.post(
  '/qr-verify',
  authenticate,
  [body('token').isUUID().withMessage('QR token must be a valid UUID')],
  authController.verifyQrToken
);
router.get('/me', authenticate, authController.getCurrentUser);
router.post(
  '/change-password',
  authenticate,
  [body('currentPassword').isString().notEmpty(), body('newPassword').isString().isLength({ min: 6 })],
  authController.changePassword
);

module.exports = router;