const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isProduction = process.env.NODE_ENV === 'production';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim()) return secret;

  if (isProduction) {
    throw new Error('JWT_SECRET is required in production');
  }

  return 'dev-only-jwt-secret-change-before-production';
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '24h' });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

// Check if user can access specific team data
const canAccessTeam = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  // Admin can access all teams
  if (req.user.role === 'admin') {
    return next();
  }

  // Team leader can only access their own team
  if (req.user.role === 'team_leader') {
    const requestedTeam = req.params.team || req.body.team || req.query.team;
    
    if (requestedTeam && requestedTeam !== req.user.team) {
      return res.status(403).json({ message: 'Access denied. Cannot access other teams.' });
    }
  }

  next();
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  canAccessTeam,
  JWT_SECRET: process.env.JWT_SECRET
};
