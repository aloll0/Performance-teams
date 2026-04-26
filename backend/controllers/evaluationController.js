const { validationResult } = require('express-validator');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const Team = require('../models/Team');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getTeamActiveMetricNames = async (teamName) => {
  const normalizedTeamName = String(teamName || '').trim();
  if (!normalizedTeamName) return [];

  const team = await Team.findOne({
    name: {
      $regex: `^${escapeRegex(normalizedTeamName)}$`,
      $options: 'i'
    }
  }).select('evaluationMetrics');

  if (!team) return [];

  return (team.evaluationMetrics || [])
    .filter((metric) => metric?.isActive !== false)
    .map((metric) => String(metric.name || '').trim())
    .filter(Boolean);
};

// Generate AI insights based on scores
const generateAIInsights = (criteria, previousEvaluation = null) => {
  const totalScore = Math.round(
    criteria.reduce((sum, c) => sum + c.score, 0) / criteria.length
  );

  // Determine performance level
  const performanceLevel = totalScore >= 90 ? 'Excellent' :
                           totalScore >= 80 ? 'Good' :
                           totalScore >= 70 ? 'Average' :
                           totalScore >= 60 ? 'Needs Improvement' : 'Poor';

  // Generate suggestion
  let suggestion = '';
  if (totalScore >= 90) {
    suggestion = 'Strong candidate for promotion and leadership roles';
  } else if (totalScore >= 80) {
    suggestion = 'Continue current development track, consider mentoring others';
  } else if (totalScore >= 70) {
    suggestion = 'Focus on skill development in weaker areas';
  } else if (totalScore >= 60) {
    suggestion = 'Needs structured improvement plan and regular check-ins';
  } else {
    suggestion = 'Immediate attention required, consider performance improvement plan';
  }

  // Calculate improvement percentage
  let improvementPercentage = 0;
  if (previousEvaluation) {
    improvementPercentage = totalScore - previousEvaluation.totalScore;
  }

  // Generate feedback message
  const weakAreas = criteria
    .filter(c => c.score < 70)
    .map(c => c.name);
  
  const strongAreas = criteria
    .filter(c => c.score >= 85)
    .map(c => c.name);

  let feedback = `Overall performance is ${performanceLevel.toLowerCase()} with a score of ${totalScore}%. `;
  
  if (strongAreas.length > 0) {
    feedback += `Strong performance in: ${strongAreas.join(', ')}. `;
  }
  
  if (weakAreas.length > 0) {
    feedback += `Areas for improvement: ${weakAreas.join(', ')}. `;
  }

  if (improvementPercentage > 0) {
    feedback += `Improved by ${improvementPercentage}% from last evaluation.`;
  } else if (improvementPercentage < 0) {
    feedback += `Declined by ${Math.abs(improvementPercentage)}% from last evaluation.`;
  } else {
    feedback += 'Performance consistent with previous evaluation.';
  }

  return {
    totalScore,
    performanceLevel,
    suggestion,
    improvementPercentage,
    aiFeedback: feedback,
    aiInsights: {
      trend: improvementPercentage >= 0 ? 'improving' : 'declining',
      consistency: Math.abs(improvementPercentage) < 10 ? 'consistent' : 'variable',
      strongAreas: strongAreas.join(', ') || 'None identified',
      weakAreas: weakAreas.join(', ') || 'None identified'
    }
  };
};

// Get all evaluations
const getAllEvaluations = async (req, res) => {
  try {
    const { employeeId, month, year, team } = req.query;
    let query = {};

    if (employeeId) query.employeeId = employeeId;
    if (month) query.month = month;
    if (year) query.year = parseInt(year);

    // Team leaders can only see their team's evaluations
    if (req.user.role === 'team_leader') {
      const teamEmployees = await User.find({
        team: req.user.team,
        role: 'employee'
      }).select('_id');
      
      const employeeIds = teamEmployees.map(emp => emp._id.toString());
      
      if (employeeId) {
        if (!employeeIds.includes(employeeId)) {
          return res.status(403).json({ message: 'Access denied' });
        }
      } else {
        query.employeeId = { $in: employeeIds };
      }
    }

    // If team filter is applied
    if (team && req.user.role === 'admin') {
      const teamEmployees = await User.find({
        team,
        role: 'employee'
      }).select('_id');
      
      const employeeIds = teamEmployees.map(emp => emp._id.toString());
      query.employeeId = { $in: employeeIds };
    }

    const evaluations = await Evaluation.find(query)
      .populate('employeeId', 'name email team level')
      .populate('evaluatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(evaluations);
  } catch (error) {
    console.error('Get all evaluations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get evaluation by ID
const getEvaluationById = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('employeeId', 'name email team level')
      .populate('evaluatedBy', 'name email');

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Check permissions
    if (req.user.role === 'team_leader') {
      const employee = await User.findById(evaluation.employeeId);
      if (employee.team !== req.user.team) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(evaluation);
  } catch (error) {
    console.error('Get evaluation by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get employee evaluation history
const getEmployeeEvaluationHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Check permissions
    if (req.user.role === 'employee' && req.user.id !== employeeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'team_leader') {
      const employee = await User.findById(employeeId);
      if (!employee || employee.team !== req.user.team) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const evaluations = await Evaluation.find({ employeeId })
      .populate('evaluatedBy', 'name email')
      .sort({ year: -1, month: -1 });

    res.json(evaluations);
  } catch (error) {
    console.error('Get employee evaluation history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create or update evaluation
const createOrUpdateEvaluation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId, month, year, criteria, notes } = req.body;

    // Verify evaluated user exists
    const evaluatedUser = await User.findById(employeeId);
    if (!evaluatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions
    if (req.user.role === 'team_leader') {
      if (evaluatedUser.role !== 'employee') {
        return res.status(403).json({ message: 'Team leaders can only evaluate employees' });
      }
      if (evaluatedUser.team !== req.user.team) {
        return res.status(403).json({ message: 'Cannot evaluate employees from other teams' });
      }
    }

    if (req.user.role === 'admin') {
      if (evaluatedUser.role !== 'team_leader') {
        return res.status(403).json({ message: 'Admin can only evaluate team leaders' });
      }
    }

    // Get previous evaluation for comparison
    const previousEvaluation = await Evaluation.findOne({
      employeeId,
      $or: [
        { year: { $lt: year } },
        { year, month: { $lt: month } }
      ]
    }).sort({ year: -1, month: -1 });

    const normalizedCriteria = Array.isArray(criteria)
      ? criteria
          .map((criterion) => ({
            name: String(criterion?.name || '').trim(),
            score: Number(criterion?.score),
            notes: String(criterion?.notes || '').trim()
          }))
          .filter((criterion) => criterion.name)
      : [];

    if (normalizedCriteria.length === 0) {
      return res.status(400).json({ message: 'At least one evaluation criterion is required' });
    }

    const invalidScore = normalizedCriteria.find((criterion) => !Number.isFinite(criterion.score) || criterion.score < 0 || criterion.score > 100);
    if (invalidScore) {
      return res.status(400).json({ message: `Criterion score for ${invalidScore.name} must be between 0 and 100` });
    }

    const activeMetricNames = await getTeamActiveMetricNames(evaluatedUser.team);
    if (activeMetricNames.length > 0) {
      const allowedNames = new Set(activeMetricNames.map((name) => name.toLowerCase()));
      const disallowed = normalizedCriteria.find((criterion) => !allowedNames.has(criterion.name.toLowerCase()));
      if (disallowed) {
        return res.status(400).json({ message: `Criterion ${disallowed.name} is not enabled for ${evaluatedUser.team}` });
      }
    }

    // Generate AI insights
    const aiData = generateAIInsights(normalizedCriteria, previousEvaluation);

    // Check if evaluation already exists for this month
    const existingEvaluation = await Evaluation.findOne({
      employeeId,
      month,
      year
    });

    let evaluation;

    if (existingEvaluation) {
      // Update existing evaluation
      existingEvaluation.criteria = normalizedCriteria;
      existingEvaluation.notes = notes;
      existingEvaluation.totalScore = aiData.totalScore;
      existingEvaluation.aiFeedback = aiData.aiFeedback;
      existingEvaluation.aiInsights = aiData.aiInsights;
      existingEvaluation.improvementPercentage = aiData.improvementPercentage;
      existingEvaluation.performanceLevel = aiData.performanceLevel;
      existingEvaluation.suggestion = aiData.suggestion;
      existingEvaluation.evaluatedBy = req.user.id;

      evaluation = await existingEvaluation.save();
      
      res.json({
        message: 'Evaluation updated successfully',
        evaluation: await evaluation.populate('employeeId evaluatedBy', 'name email team level')
      });
    } else {
      // Create new evaluation
      evaluation = await Evaluation.create({
        employeeId,
        evaluatedBy: req.user.id,
        month,
        year,
        criteria: normalizedCriteria,
        notes,
        totalScore: aiData.totalScore,
        aiFeedback: aiData.aiFeedback,
        aiInsights: aiData.aiInsights,
        improvementPercentage: aiData.improvementPercentage,
        performanceLevel: aiData.performanceLevel,
        suggestion: aiData.suggestion
      });

      res.status(201).json({
        message: 'Evaluation created successfully',
        evaluation: await evaluation.populate('employeeId evaluatedBy', 'name email team level')
      });
    }
  } catch (error) {
    console.error('Create/update evaluation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get evaluation statistics for an employee
const getEmployeeStats = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Check permissions
    if (req.user.role === 'employee' && req.user.id !== employeeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'team_leader') {
      const employee = await User.findById(employeeId);
      if (!employee || employee.team !== req.user.team) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const evaluations = await Evaluation.find({ employeeId })
      .sort({ year: 1, month: 1 });

    if (evaluations.length === 0) {
      return res.json({
        totalEvaluations: 0,
        averageScore: 0,
        trend: 'no data',
        bestPerformance: null,
        worstPerformance: null
      });
    }

    const scores = evaluations.map(e => e.totalScore);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    
    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];
    const trend = lastScore > firstScore ? 'improving' : 
                  lastScore < firstScore ? 'declining' : 'stable';

    const bestPerformance = evaluations.reduce((best, current) => 
      current.totalScore > best.totalScore ? current : best
    );

    const worstPerformance = evaluations.reduce((worst, current) => 
      current.totalScore < worst.totalScore ? current : worst
    );

    const criterionBuckets = {};
    for (const evaluation of evaluations) {
      for (const criterion of evaluation.criteria || []) {
        const criterionName = String(criterion.name || '').trim();
        if (!criterionName) continue;

        if (!criterionBuckets[criterionName]) {
          criterionBuckets[criterionName] = [];
        }
        criterionBuckets[criterionName].push(criterion.score);
      }
    }

    const criterionAverages = Object.fromEntries(
      Object.entries(criterionBuckets).map(([criterionName, scores]) => {
        const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        return [criterionName, average];
      })
    );

    res.json({
      totalEvaluations: evaluations.length,
      averageScore,
      trend,
      improvement: lastScore - firstScore,
      bestPerformance: {
        month: bestPerformance.month,
        year: bestPerformance.year,
        score: bestPerformance.totalScore
      },
      worstPerformance: {
        month: worstPerformance.month,
        year: worstPerformance.year,
        score: worstPerformance.totalScore
      },
      criterionAverages,
      recentEvaluations: evaluations.slice(-3).map(e => ({
        month: e.month,
        year: e.year,
        score: e.totalScore,
        performanceLevel: e.performanceLevel
      }))
    });
  } catch (error) {
    console.error('Get employee stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllEvaluations,
  getEvaluationById,
  getEmployeeEvaluationHistory,
  createOrUpdateEvaluation,
  getEmployeeStats
};
