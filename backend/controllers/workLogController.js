const WorkLog = require('../models/WorkLog');

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function calculateTotalHours(items) {
  return Number(items.reduce((sum, item) => sum + Number(item.hours || 0), 0).toFixed(2));
}

const submitMyWorkLog = async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Only employees can submit daily work logs.' });
    }

    const { date = getTodayDate(), items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Please add at least one task.' });
    }

    const normalizedItems = items.map((item) => ({
      task: String(item.task || '').trim(),
      hours: Number(item.hours),
      notes: String(item.notes || '').trim()
    }));

    if (normalizedItems.some((item) => !item.task || Number.isNaN(item.hours) || item.hours <= 0)) {
      return res.status(400).json({ message: 'Each task needs a valid title and hours.' });
    }

    const totalHours = calculateTotalHours(normalizedItems);
    if (totalHours > 7) {
      return res.status(400).json({ message: 'Daily log cannot exceed 7 total hours.' });
    }

    const workLog = await WorkLog.findOneAndUpdate(
      { employeeId: req.user.id, date },
      {
        employeeId: req.user.id,
        team: req.user.team,
        date,
        items: normalizedItems,
        totalHours,
        status: 'submitted',
        updatedAt: new Date()
      },
      { upsert: true, returnDocument: 'after' }
    );

    return res.json({ message: 'Daily work log saved.', workLog });
  } catch (error) {
    console.error('Submit work log error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getMyWorkLogs = async (req, res) => {
  try {
    const logs = await WorkLog.find({ employeeId: req.user.id }).sort({ date: -1 });
    return res.json(logs);
  } catch (error) {
    console.error('Get my work logs error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getTeamWorkLogs = async (req, res) => {
  try {
    if (!['admin', 'team_leader'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only admins and team leaders can view team logs.' });
    }

    const { date, employeeId } = req.query;
    const query = {};

    if (req.user.role === 'team_leader') {
      query.team = req.user.team;
    }

    if (date) {
      query.date = date;
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const logs = await WorkLog.find(query)
      .populate('employeeId', 'name email team level')
      .sort({ date: -1, updatedAt: -1 });

    return res.json(logs);
  } catch (error) {
    console.error('Get team work logs error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const reviewWorkLog = async (req, res) => {
  try {
    if (!['admin', 'team_leader'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only admins and team leaders can review logs.' });
    }

    const { id } = req.params;
    const { leaderComment = '' } = req.body;

    const workLog = await WorkLog.findById(id).populate('employeeId', 'team');
    if (!workLog) {
      return res.status(404).json({ message: 'Work log not found.' });
    }

    if (req.user.role === 'team_leader' && workLog.team !== req.user.team) {
      return res.status(403).json({ message: 'Cannot review logs from other teams.' });
    }

    workLog.status = 'reviewed';
    workLog.leaderComment = String(leaderComment).trim();
    await workLog.save();

    return res.json({ message: 'Work log reviewed.', workLog });
  } catch (error) {
    console.error('Review work log error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitMyWorkLog,
  getMyWorkLogs,
  getTeamWorkLogs,
  reviewWorkLog
};
