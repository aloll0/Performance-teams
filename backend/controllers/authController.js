const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const toAccountName = (name) => String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

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

// Get demo credentials
const getDemoCredentials = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }

    const employees = await User.find({ role: 'employee', isActive: true })
      .select('name team email')
      .sort({ team: 1, name: 1 });

    const demoCredentials = {
      admin: {
        email: 'admin@demo.com',
        password: '123456'
      },
      teamLeaders: [
        { team: 'Research', email: 'research@thimify.com', password: 'Research@123' },
        { team: 'Debuger', email: 'debuger@thimify.com', password: 'Debuger@123' },
        { team: 'Shopify', email: 'shopify@thimify.com', password: 'Shopify@123' },
        { team: 'Zid', email: 'zid@thimify.com', password: 'Zid@123' },
        { team: 'Salla', email: 'salla@thimify.com', password: 'Salla@123' },
        { team: 'Wordpress', email: 'wordpress@thimify.com', password: 'Wordpress@123' },
        { team: 'Taster', email: 'taster@thimify.com', password: 'Taster@123' },
        { team: 'UIUX', email: 'uiux@thimify.com', password: 'Uiux@123' },
        { team: 'Graphic', email: 'graphic@thimify.com', password: 'Graphic@123' },
        { team: 'Content', email: 'content@thimify.com', password: 'Content@123' },
        { team: 'Bussiness', email: 'business@thimify.com', password: 'Business@123' }
      ],
      employees: employees.map((employee) => ({
        name: employee.name,
        team: employee.team,
        email: employee.email
      }))
    };

    res.json(demoCredentials);
  } catch (error) {
    console.error('Get demo credentials error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login,
  getCurrentUser,
  changePassword,
  getDemoCredentials
};
