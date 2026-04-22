const { validationResult } = require('express-validator');
const User = require('../models/User');
const Team = require('../models/Team');

const serializeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  role: user.role,
  team: user.team,
  level: user.level,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { role, team, search, includeInactive } = req.query;
    
    // Build query filter
    const query = {};
    
    // Only include active users by default (unless includeInactive is explicitly set)
    if (includeInactive !== 'true') {
      query.isActive = true;
    }
    
    if (role) {
      query.role = role;
    }

    if (team) {
      query.team = team;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Team leaders can only see their team members
    if (req.user.role === 'team_leader') {
      query.team = req.user.team;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users.map(serializeUser));
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions
    if (req.user.role === 'team_leader' && user.team !== req.user.team) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(serializeUser(user));
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { name, email, password, role, team, level } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    
        // For team leaders, automatically use their team if not provided
        if (req.user.role === 'team_leader' && !team) {
          team = req.user.team;
        }
    
    const normalizedTeam = team ? String(team).trim() : undefined;
    const normalizedRole = String(role || '').trim();

    if (!['admin', 'team_leader', 'employee'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    // Validate that non-admin users have a team
    if (normalizedRole !== 'admin' && !normalizedTeam) {
      return res.status(400).json({ message: 'Team is required for employees and team leaders' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (!existingUser.isActive && existingUser.role === 'employee') {
        if (req.user.role === 'team_leader') {
          if (normalizedRole !== 'employee') {
            return res.status(403).json({ message: 'Team leaders can only create employees' });
          }
          if (normalizedTeam !== req.user.team) {
            return res.status(403).json({ message: 'Cannot create employee in another team' });
          }
        }

        existingUser.name = String(name || '').trim();
        existingUser.password = password;
        existingUser.role = 'employee';
        existingUser.team = normalizedTeam;
        existingUser.level = level;
        existingUser.isActive = true;
        await existingUser.save();

        return res.status(200).json({
          message: 'Employee account reactivated successfully',
          user: serializeUser(existingUser)
        });
      }

      return res.status(400).json({ message: 'Email already exists' });
    }

    // Team leaders can only create employees in their team
    if (req.user.role === 'team_leader') {
      if (normalizedRole !== 'employee') {
        return res.status(403).json({ message: 'Team leaders can only create employees' });
      }
      if (normalizedTeam !== req.user.team) {
        return res.status(403).json({ message: 'Cannot create employee in another team' });
      }
    }

    if (normalizedRole === 'team_leader') {
      const existingTeam = await Team.findOne({
        name: { $regex: `^${escapeRegex(normalizedTeam)}$`, $options: 'i' }
      });
      if (existingTeam) {
        return res.status(400).json({ message: 'Team name already exists' });
      }
    }

    const user = await User.create({
      name: String(name || '').trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole,
      team: normalizedTeam,
      level: normalizedRole === 'employee' ? level : undefined
    });

    if (normalizedRole === 'team_leader') {
      try {
        await Team.create({
          name: normalizedTeam,
          leaderId: user._id,
          description: ''
        });
      } catch (teamError) {
        await user.deleteOne();
        throw teamError;
      }
    }

    res.status(201).json({
      message: 'User created successfully',
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, team, level, isActive } = req.body;
    const userId = req.params.id;
    const normalizedEmail = email ? String(email).trim().toLowerCase() : undefined;
    const normalizedTeam = team ? String(team).trim() : undefined;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions
    if (req.user.role === 'team_leader') {
      // Team leaders can only update employees in their team
      if (user.team !== req.user.team) {
        return res.status(403).json({ message: 'Access denied' });
      }
      // Team leaders cannot change team
      if (team && team !== req.user.team) {
        return res.status(403).json({ message: 'Cannot change team' });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (normalizedEmail) user.email = normalizedEmail;
    if (normalizedTeam && req.user.role === 'admin') user.team = normalizedTeam;
    if (level && user.role === 'employee') user.level = level;
    if (isActive !== undefined && req.user.role === 'admin') user.isActive = isActive;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user (soft delete by deactivating)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions
    if (req.user.role === 'team_leader') {
      if (user.team !== req.user.team) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (user.role !== 'employee') {
        return res.status(403).json({ message: 'Cannot delete team leaders' });
      }
    }

    // Soft delete by deactivating
    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin reset password for employee or team leader
const adminResetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Use account settings to change admin password' });
    }

    user.password = String(newPassword);
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update current user avatar
const updateMyAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar || typeof avatar !== 'string') {
      return res.status(400).json({ message: 'Avatar is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = avatar.trim();
    await user.save();

    res.json({
      message: 'Profile image updated successfully',
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove current user avatar
const removeMyAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = '';
    await user.save();

    res.json({
      message: 'Profile image removed successfully',
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Remove avatar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Move employee between teams (Admin only)
const moveEmployee = async (req, res) => {
  try {
    const { employeeId, newTeam } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (employee.role !== 'employee') {
      return res.status(400).json({ message: 'Can only move employees' });
    }

    const oldTeam = employee.team;
    employee.team = newTeam;
    await employee.save();

    res.json({
      message: 'Employee moved successfully',
      employee: {
        id: employee._id.toString(),
        name: employee.name,
        oldTeam,
        newTeam: employee.team
      }
    });
  } catch (error) {
    console.error('Move employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get employees by team
const getEmployeesByTeam = async (req, res) => {
  try {
    const { team } = req.params;

    // Check permissions
    if (req.user.role === 'team_leader' && req.user.team !== team) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const employees = await User.find({ 
      team, 
      role: 'employee',
      isActive: true 
    }).select('-password');

    res.json(employees.map(serializeUser));
  } catch (error) {
    console.error('Get employees by team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get team leaders
const getTeamLeaders = async (req, res) => {
  try {
    const teamLeaders = await User.find({ 
      role: 'team_leader',
      isActive: true 
    }).select('-password');

    res.json(teamLeaders.map(serializeUser));
  } catch (error) {
    console.error('Get team leaders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  adminResetUserPassword,
  updateMyAvatar,
  removeMyAvatar,
  moveEmployee,
  getEmployeesByTeam,
  getTeamLeaders
};
