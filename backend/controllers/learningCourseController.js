const LearningCourse = require('../models/LearningCourse');
const User = require('../models/User');

const toStringId = (value) => String(value || '');

const serializeCourse = (course, reqUserId, teamSizes = {}) => {
  const completedByMe = course.completions.some(
    (entry) => toStringId(entry.userId?._id || entry.userId) === toStringId(reqUserId)
  );

  const completionCount = course.completions.length;
  const teamSize = teamSizes[course.team] || 0;
  const completionRate = teamSize > 0 ? Math.round((completionCount / teamSize) * 100) : 0;

  return {
    id: course._id.toString(),
    title: course.title,
    url: course.url,
    platform: course.platform,
    focusArea: course.focusArea,
    notes: course.notes,
    team: course.team,
    isActive: course.isActive,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    createdBy: course.createdBy
      ? {
          id: course.createdBy._id ? course.createdBy._id.toString() : toStringId(course.createdBy),
          name: course.createdBy.name,
          email: course.createdBy.email
        }
      : null,
    completionCount,
    teamSize,
    completionRate,
    isCompletedByMe: completedByMe,
    completions: course.completions.map((entry) => ({
      userId: entry.userId?._id ? entry.userId._id.toString() : toStringId(entry.userId),
      userName: entry.userId?.name,
      completedAt: entry.completedAt
    }))
  };
};

const resolveRequestedTeam = (req) => {
  if (req.user.role === 'team_leader' || req.user.role === 'employee') {
    return req.user.team;
  }

  return req.query.team ? String(req.query.team).trim() : undefined;
};

const getCourses = async (req, res) => {
  try {
    const requestedTeam = resolveRequestedTeam(req);
    const query = { isActive: true };

    if (requestedTeam) {
      query.team = requestedTeam;
    }

    const courses = await LearningCourse.find(query)
      .populate('createdBy', 'name email')
      .populate('completions.userId', 'name')
      .sort({ createdAt: -1 });

    const teams = [...new Set(courses.map((course) => course.team))];
    const teamSizeEntries = await Promise.all(
      teams.map(async (teamName) => {
        const size = await User.countDocuments({
          team: teamName,
          isActive: true,
          role: { $in: ['employee', 'team_leader'] }
        });
        return [teamName, size];
      })
    );
    const teamSizes = Object.fromEntries(teamSizeEntries);

    return res.json(courses.map((course) => serializeCourse(course, req.user.id, teamSizes)));
  } catch (error) {
    console.error('Get courses error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, url, platform = '', focusArea = '', notes = '', team } = req.body;

    const normalizedTitle = String(title || '').trim();
    const normalizedUrl = String(url || '').trim();
    const normalizedPlatform = String(platform || '').trim();
    const normalizedFocusArea = String(focusArea || '').trim();
    const normalizedNotes = String(notes || '').trim();

    const normalizedTeam = req.user.role === 'team_leader'
      ? req.user.team
      : String(team || '').trim();

    if (!normalizedTitle) {
      return res.status(400).json({ message: 'Course title is required' });
    }

    if (!normalizedUrl) {
      return res.status(400).json({ message: 'Course URL is required' });
    }

    try {
      // Validate URL shape to avoid saving malformed links.
      new URL(normalizedUrl);
    } catch (_error) {
      return res.status(400).json({ message: 'Please provide a valid URL' });
    }

    if (!normalizedTeam) {
      return res.status(400).json({ message: 'Team is required' });
    }

    const course = await LearningCourse.create({
      title: normalizedTitle,
      url: normalizedUrl,
      platform: normalizedPlatform,
      focusArea: normalizedFocusArea,
      notes: normalizedNotes,
      team: normalizedTeam,
      createdBy: req.user.id,
      completions: []
    });

    const hydrated = await LearningCourse.findById(course._id)
      .populate('createdBy', 'name email')
      .populate('completions.userId', 'name');

    const teamSize = await User.countDocuments({
      team: normalizedTeam,
      isActive: true,
      role: { $in: ['employee', 'team_leader'] }
    });

    return res.status(201).json({
      message: 'Course added successfully',
      course: serializeCourse(hydrated, req.user.id, { [normalizedTeam]: teamSize })
    });
  } catch (error) {
    console.error('Create course error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    const course = await LearningCourse.findById(id)
      .populate('createdBy', 'name email')
      .populate('completions.userId', 'name');

    if (!course || !course.isActive) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.team !== req.user.team) {
      return res.status(403).json({ message: 'Access denied for this team course' });
    }

    const currentUserId = toStringId(req.user.id);
    const existingIndex = course.completions.findIndex(
      (entry) => toStringId(entry.userId?._id || entry.userId) === currentUserId
    );

    if (completed === false) {
      if (existingIndex >= 0) {
        course.completions.splice(existingIndex, 1);
      }
    } else if (existingIndex === -1) {
      course.completions.push({ userId: req.user.id, completedAt: new Date() });
    }

    await course.save();
    await course.populate('completions.userId', 'name');

    const teamSize = await User.countDocuments({
      team: course.team,
      isActive: true,
      role: { $in: ['employee', 'team_leader'] }
    });

    return res.json({
      message: completed === false ? 'Completion removed' : 'Marked as completed',
      course: serializeCourse(course, req.user.id, { [course.team]: teamSize })
    });
  } catch (error) {
    console.error('Update completion error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await LearningCourse.findById(id);
    if (!course || !course.isActive) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role === 'team_leader' && course.team !== req.user.team) {
      return res.status(403).json({ message: 'Cannot remove a course outside your team' });
    }

    course.isActive = false;
    await course.save();

    return res.json({ message: 'Course removed successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCourses,
  createCourse,
  updateCompletion,
  deleteCourse
};
