const { validationResult } = require('express-validator');
const User = require('../models/User');
const Team = require('../models/Team');

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { role, team, search } = req.query;
    let query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by team
    if (team) {
      query.team = team;
    }

    // Search by name or email
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

    res.json(users);
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

    res.json(user);
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

    const { name, email, password, role, team, level } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Team leaders can only create employees in their team
    if (req.user.role === 'team_leader') {
      if (role !== 'employee') {
        return res.status(403).json({ message: 'Team leaders can only create employees' });
      }
      if (team !== req.user.team) {
        return res.status(403).json({ message: 'Cannot create employee in another team' });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      team,
      level: role === 'employee' ? level : undefined
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team,
        level: user.level
      }
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
    if (email) user.email = email;
    if (team && req.user.role === 'admin') user.team = team;
    if (level && user.role === 'employee') user.level = level;
    if (isActive !== undefined && req.user.role === 'admin') user.isActive = isActive;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team,
        level: user.level,
        isActive: user.isActive
      }
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
        id: employee._id,
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

    res.json(employees);
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

    res.json(teamLeaders);
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
  moveEmployee,
  getEmployeesByTeam,
  getTeamLeaders
};
