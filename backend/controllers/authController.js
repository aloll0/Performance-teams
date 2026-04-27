const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const {
  createQrSession,
  getQrSession,
  approveQrSession,
  consumeApprovedQrSession,
} = require('../utils/qrLoginStore');

// Login
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        team: user.team,
        level: user.level
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      team: user.team,
      level: user.level,
      isActive: user.isActive,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create short-lived QR token for desktop login
const createQrToken = async (_req, res) => {
  try {
    const session = createQrSession();

    res.status(201).json({
      token: session.token,
      expiresAt: new Date(session.expiresAt).toISOString(),
      ttlSeconds: Math.floor(session.ttlMs / 1000),
    });
  } catch (error) {
    console.error('Create QR token error:', error);
    res.status(500).json({ message: 'Server error while generating QR token' });
  }
};

// Poll QR token status from desktop
const getQrTokenStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const session = getQrSession(token);

    if (!session) {
      return res.status(404).json({ status: 'invalid_or_expired' });
    }

    if (session.status === 'pending') {
      return res.json({
        status: 'pending',
        expiresAt: new Date(session.expiresAt).toISOString(),
      });
    }

    const consumed = consumeApprovedQrSession(token);
    if (!consumed.ok) {
      return res.status(409).json({ status: consumed.reason });
    }

    const user = await User.findById(consumed.session.approvedByUserId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Approving user is not active.' });
    }

    const authToken = generateToken(user._id);

    return res.json({
      status: 'approved',
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        team: user.team,
        level: user.level,
      },
    });
  } catch (error) {
    console.error('Get QR token status error:', error);
    res.status(500).json({ message: 'Server error while checking QR token status' });
  }
};

// Verify scanned QR token from authenticated mobile client
const verifyQrToken = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body;
    const result = approveQrSession(token, req.user.id);

    if (!result.ok) {
      if (result.reason === 'already_used') {
        return res.status(409).json({ message: 'QR token has already been used.' });
      }
      return res.status(400).json({ message: 'QR token is invalid or expired.' });
    }

    res.json({
      message: 'QR login approved',
      expiresAt: new Date(result.session.expiresAt).toISOString(),
    });
  } catch (error) {
    console.error('Verify QR token error:', error);
    res.status(500).json({ message: 'Server error while verifying QR token' });
  }
};

module.exports = {
  login,
  getCurrentUser,
  changePassword,
  createQrToken,
  getQrTokenStatus,
  verifyQrToken,
};
