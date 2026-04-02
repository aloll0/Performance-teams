const mongoose = require('mongoose');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const Team = require('../models/Team');

// Get dashboard analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    let teamFilter = {};
    
    // Team leaders can only see their team's data
    if (req.user.role === 'team_leader') {
      teamFilter.team = req.user.team;
    }

    // Get all active employees
    const employees = await User.find({
      role: 'employee',
      isActive: true,
      ...teamFilter
    });

    // Get all evaluations
    const employeeIds = employees.map(emp => emp._id.toString());
    const evaluations = await Evaluation.find({
      employeeId: { $in: employeeIds }
    });

    // Overall statistics
    const totalEmployees = employees.length;
    const totalEvaluations = evaluations.length;
    
    const averageScore = totalEvaluations > 0 
      ? Math.round(evaluations.reduce((sum, e) => sum + e.totalScore, 0) / totalEvaluations)
      : 0;

    // Performance distribution
    const performanceDistribution = {
      Excellent: 0,
      Good: 0,
      Average: 0,
      'Needs Improvement': 0,
      Poor: 0
    };

    evaluations.forEach(e => {
      if (performanceDistribution[e.performanceLevel] !== undefined) {
        performanceDistribution[e.performanceLevel]++;
      }
    });

    // Team statistics (for admin)
    let teamStats = [];
    if (req.user.role === 'admin') {
      const teams = await Team.find();
      
      teamStats = await Promise.all(
        teams.map(async (team) => {
          const teamEmployees = await User.find({
            team: team.name,
            role: 'employee',
            isActive: true
          });

          const teamEmployeeIds = teamEmployees.map(emp => emp._id.toString());
          const teamEvaluations = await Evaluation.find({
            employeeId: { $in: teamEmployeeIds }
          });

          const teamAverage = teamEvaluations.length > 0
            ? Math.round(teamEvaluations.reduce((sum, e) => sum + e.totalScore, 0) / teamEvaluations.length)
            : 0;

          return {
            teamName: team.name,
            employeeCount: teamEmployees.length,
            evaluationCount: teamEvaluations.length,
            averageScore: teamAverage
          };
        })
      );

      // Sort by average score
      teamStats.sort((a, b) => b.averageScore - a.averageScore);
    }

    // Top performers
    const latestEvaluations = await Evaluation.aggregate([
      {
        $match: {
          employeeId: { $in: employeeIds.map(id => new mongoose.Types.ObjectId(id)) }
        }
      },
      {
        $sort: { year: -1, month: -1 }
      },
      {
        $group: {
          _id: '$employeeId',
          latestEvaluation: { $first: '$$ROOT' }
        }
      },
      {
        $sort: { 'latestEvaluation.totalScore': -1 }
      },
      {
        $limit: 5
      }
    ]);

    const topPerformers = await Promise.all(
      latestEvaluations.map(async (item) => {
        const employee = await User.findById(item._id).select('name team level');
        return {
          employee,
          score: item.latestEvaluation.totalScore,
          performanceLevel: item.latestEvaluation.performanceLevel,
          month: item.latestEvaluation.month,
          year: item.latestEvaluation.year
        };
      })
    );

    // Monthly trend (last 6 months)
    const months = ['January', 'February', 'March', 'April', 'May', 'June'];
    const monthlyTrend = months.map(month => {
      const monthEvaluations = evaluations.filter(e => e.month === month);
      const monthAverage = monthEvaluations.length > 0
        ? Math.round(monthEvaluations.reduce((sum, e) => sum + e.totalScore, 0) / monthEvaluations.length)
        : 0;
      
      return {
        month,
        averageScore: monthAverage,
        evaluationCount: monthEvaluations.length
      };
    });

    // Level distribution
    const levelDistribution = employees.reduce((acc, emp) => {
      acc[emp.level] = (acc[emp.level] || 0) + 1;
      return acc;
    }, {});

    res.json({
      overview: {
        totalEmployees,
        totalEvaluations,
        averageScore,
        evaluatedThisMonth: evaluations.filter(e => e.month === 'March').length
      },
      performanceDistribution,
      teamStats,
      topPerformers,
      monthlyTrend,
      levelDistribution
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get team leader performance (for admin)
const getTeamLeaderPerformance = async (req, res) => {
  try {
    const teamLeaders = await User.find({
      role: 'team_leader',
      isActive: true
    });

    const performance = await Promise.all(
      teamLeaders.map(async (leader) => {
        const teamEmployees = await User.find({
          team: leader.team,
          role: 'employee',
          isActive: true
        });

        const employeeIds = teamEmployees.map(emp => emp._id.toString());
        const evaluations = await Evaluation.find({
          employeeId: { $in: employeeIds }
        });

        const averageScore = evaluations.length > 0
          ? Math.round(evaluations.reduce((sum, e) => sum + e.totalScore, 0) / evaluations.length)
          : 0;

        const recentEvaluations = evaluations.filter(e => 
          e.month === 'March' || e.month === 'February'
        );

        return {
          leader: {
            id: leader._id,
            name: leader.name,
            email: leader.email,
            team: leader.team
          },
          teamSize: teamEmployees.length,
          totalEvaluations: evaluations.length,
          averageScore,
          recentEvaluations: recentEvaluations.length,
          performanceLevel: averageScore >= 80 ? 'Good' : 
                           averageScore >= 70 ? 'Average' : 'Needs Improvement'
        };
      })
    );

    // Sort by average score
    performance.sort((a, b) => b.averageScore - a.averageScore);

    res.json(performance);
  } catch (error) {
    console.error('Get team leader performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get detailed team analytics
const getTeamAnalytics = async (req, res) => {
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

    const employees = await User.find({
      team: teamName,
      role: 'employee',
      isActive: true
    });

    const employeeIds = employees.map(emp => emp._id.toString());
    const evaluations = await Evaluation.find({
      employeeId: { $in: employeeIds }
    });

    // Employee performance
    const employeePerformance = await Promise.all(
      employees.map(async (employee) => {
        const employeeEvaluations = evaluations.filter(
          e => e.employeeId.toString() === employee._id.toString()
        );

        const averageScore = employeeEvaluations.length > 0
          ? Math.round(employeeEvaluations.reduce((sum, e) => sum + e.totalScore, 0) / employeeEvaluations.length)
          : 0;

        const latestEvaluation = employeeEvaluations.sort((a, b) => {
          const months = ['January', 'February', 'March', 'April', 'May', 'June'];
          return months.indexOf(b.month) - months.indexOf(a.month);
        })[0];

        return {
          employee: {
            id: employee._id,
            name: employee.name,
            level: employee.level
          },
          evaluationCount: employeeEvaluations.length,
          averageScore,
          latestScore: latestEvaluation?.totalScore || 0,
          performanceLevel: latestEvaluation?.performanceLevel || 'Not Evaluated'
        };
      })
    );

    // Sort by average score
    employeePerformance.sort((a, b) => b.averageScore - a.averageScore);

    // Criterion averages
    const criteriaNames = ['Code Quality', 'Performance', 'Communication', 'Problem Solving', 'Teamwork', 'Punctuality'];
    const criterionAverages = {};

    criteriaNames.forEach(criterionName => {
      const scores = evaluations.flatMap(e => 
        e.criteria.filter(c => c.name === criterionName).map(c => c.score)
      );
      
      criterionAverages[criterionName] = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    });

    // Monthly progress
    const monthlyProgress = ['January', 'February', 'March'].map(month => {
      const monthEvaluations = evaluations.filter(e => e.month === month);
      return {
        month,
        averageScore: monthEvaluations.length > 0
          ? Math.round(monthEvaluations.reduce((sum, e) => sum + e.totalScore, 0) / monthEvaluations.length)
          : 0,
        evaluationCount: monthEvaluations.length
      };
    });

    res.json({
      team: team.toObject(),
      totalEmployees: employees.length,
      totalEvaluations: evaluations.length,
      overallAverage: evaluations.length > 0
        ? Math.round(evaluations.reduce((sum, e) => sum + e.totalScore, 0) / evaluations.length)
        : 0,
      employeePerformance,
      criterionAverages,
      monthlyProgress
    });
  } catch (error) {
    console.error('Get team analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardAnalytics,
  getTeamLeaderPerformance,
  getTeamAnalytics
};
