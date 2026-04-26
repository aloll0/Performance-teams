const { validationResult } = require('express-validator');
const Team = require('../models/Team');
const User = require('../models/User');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const DEFAULT_EVALUATION_METRICS = [
  'Code Quality',
  'Performance',
  'Communication',
  'Problem Solving',
  'Teamwork',
  'Punctuality'
];

const normalizeEvaluationMetrics = (metrics) => {
  if (!Array.isArray(metrics) || metrics.length === 0) {
    return DEFAULT_EVALUATION_METRICS.map((name) => ({ name, isActive: true }));
  }

  const seen = new Set();

  return metrics
    .map((metric) => {
      const name = String(metric?.name || '').trim();
      if (!name) return null;

      const normalizedKey = name.toLowerCase();
      if (seen.has(normalizedKey)) return null;
      seen.add(normalizedKey);

      return {
        name,
        isActive: metric?.isActive !== false
      };
    })
    .filter(Boolean);
};

// Get all teams
const getAllTeams = async (req, res) => {
  try {
    // Backfill missing teams for existing active team leaders.
    const leadersWithTeams = await User.find({
      role: 'team_leader',
      isActive: true,
      team: { $exists: true, $ne: '' }
    }).select('_id team');

    for (const leader of leadersWithTeams) {
      const normalizedTeamName = String(leader.team || '').trim();
      if (!normalizedTeamName) continue;

      const existingTeam = await Team.findOne({
        name: {
          $regex: `^${escapeRegex(normalizedTeamName)}$`,
          $options: 'i'
        }
      });

      if (!existingTeam) {
        await Team.create({
          name: normalizedTeamName,
          leaderId: leader._id,
          description: ''
        });
      }
    }

    let query = {};

    // Team leaders can only see their own team
    if (req.user.role === 'team_leader') {
      query.name = req.user.team;
    }

    const teams = await Team.find(query)
      .populate('leaderId', 'name email')
      .sort({ name: 1 });

    // Add employee count for each team
    const teamsWithCount = await Promise.all(
      teams.map(async (team) => {
        const employeeCount = await User.countDocuments({
          team: team.name,
          role: 'employee',
          isActive: true
        });
        return {
          ...team.toObject(),
          employeeCount
        };
      })
    );

    res.json(teamsWithCount);
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get team by ID
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('leaderId', 'name email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check permissions
    if (req.user.role === 'team_leader' && team.name !== req.user.team) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get team employees
    const employees = await User.find({
      team: team.name,
      role: 'employee',
      isActive: true
    }).select('-password');

    res.json({
      ...team.toObject(),
      employees
    });
  } catch (error) {
    console.error('Get team by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new team (Admin only)
const createTeam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, leaderId } = req.body;

    // Check if team name already exists
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({ message: 'Team name already exists' });
    }

    // Verify leader exists and is a team leader
    const leader = await User.findById(leaderId);
    if (!leader) {
      return res.status(404).json({ message: 'Team leader not found' });
    }
    if (leader.role !== 'team_leader') {
      return res.status(400).json({ message: 'Selected user is not a team leader' });
    }

    const team = await Team.create({
      name,
      description,
      leaderId
    });

    // Update leader's team
    leader.team = name;
    await leader.save();

    res.status(201).json({
      message: 'Team created successfully',
      team: await team.populate('leaderId', 'name email')
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update team (Admin only)
const updateTeam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, leaderId } = req.body;
    const teamId = req.params.id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Update leader if changed
    if (leaderId && leaderId !== team.leaderId.toString()) {
      const newLeader = await User.findById(leaderId);
      if (!newLeader) {
        return res.status(404).json({ message: 'New team leader not found' });
      }
      if (newLeader.role !== 'team_leader') {
        return res.status(400).json({ message: 'Selected user is not a team leader' });
      }

      // Update old leader's team
      const oldLeader = await User.findById(team.leaderId);
      if (oldLeader) {
        oldLeader.team = undefined;
        await oldLeader.save();
      }

      // Update new leader's team
      newLeader.team = name || team.name;
      await newLeader.save();

      team.leaderId = leaderId;
    }

    if (name) team.name = name;
    if (description !== undefined) team.description = description;

    await team.save();

    res.json({
      message: 'Team updated successfully',
      team: await team.populate('leaderId', 'name email')
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete team (Admin only)
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if team has employees
    const employeeCount = await User.countDocuments({
      team: team.name,
      role: 'employee',
      isActive: true
    });

    if (employeeCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete team with active employees. Move or delete employees first.'
      });
    }

    // Update team leader
    const leader = await User.findById(team.leaderId);
    if (leader) {
      leader.team = undefined;
      await leader.save();
    }

    await team.deleteOne();

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get team statistics
const getTeamStats = async (req, res) => {
  try {
    const { teamName } = req.params;

    // Check permissions
    if (req.user.role === 'team_leader' && req.user.team !== teamName) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const team = await Team.findOne({ name: teamName })
      .populate('leaderId', 'name email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get employee stats
    const employees = await User.find({
      team: teamName,
      role: 'employee',
      isActive: true
    }).select('-password');

    const levelDistribution = employees.reduce((acc, emp) => {
      acc[emp.level] = (acc[emp.level] || 0) + 1;
      return acc;
    }, {});

    res.json({
      team: team.toObject(),
      totalEmployees: employees.length,
      levelDistribution,
      employees
    });
  } catch (error) {
    console.error('Get team stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTeamEvaluationMetrics = async (req, res) => {
  try {
    const requestedTeam = String(req.query.team || '').trim();
    const teamName = req.user.role === 'team_leader'
      ? req.user.team
      : (requestedTeam || req.user.team);

    if (!teamName) {
      return res.status(400).json({ message: 'Team is required' });
    }

    const team = await Team.findOne({
      name: {
        $regex: `^${escapeRegex(teamName)}$`,
        $options: 'i'
      }
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (req.user.role === 'team_leader' && team.name !== req.user.team) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const metrics = normalizeEvaluationMetrics(team.evaluationMetrics || []);
    return res.json({
      team: team.name,
      metrics
    });
  } catch (error) {
    console.error('Get team evaluation metrics error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateTeamEvaluationMetrics = async (req, res) => {
  try {
    const requestedTeam = String(req.body.team || req.query.team || '').trim();
    const teamName = req.user.role === 'team_leader' ? req.user.team : requestedTeam;

    if (!teamName) {
      return res.status(400).json({ message: 'Team is required' });
    }

    const team = await Team.findOne({
      name: {
        $regex: `^${escapeRegex(teamName)}$`,
        $options: 'i'
      }
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (req.user.role === 'team_leader' && team.name !== req.user.team) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const metrics = normalizeEvaluationMetrics(req.body.metrics || []);
    if (metrics.length === 0) {
      return res.status(400).json({ message: 'At least one evaluation metric is required' });
    }

    team.evaluationMetrics = metrics;
    await team.save();

    return res.json({
      message: 'Evaluation metrics updated successfully',
      team: team.name,
      metrics: normalizeEvaluationMetrics(team.evaluationMetrics)
    });
  } catch (error) {
    console.error('Update team evaluation metrics error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamStats,
  getTeamEvaluationMetrics,
  updateTeamEvaluationMetrics
};
