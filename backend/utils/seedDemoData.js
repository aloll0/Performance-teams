const User = require('../models/User');
const Team = require('../models/Team');
const Quiz = require('../models/Quiz');
const Evaluation = require('../models/Evaluation');

const teamDefinitions = [
  { name: 'Research', description: 'Research and development team' },
  { name: 'Debuger', description: 'Debugging and issue resolution team' },
  { name: 'Shopify', description: 'Shopify implementation team' },
  { name: 'Zed', description: 'Operations and support team' },
  { name: 'Salla', description: 'Commerce growth team' },
  { name: 'Wordpress', description: 'WordPress delivery team' },
  { name: 'Taster', description: 'Quality and experimentation team' },
  { name: 'UIUX', description: 'Design and user experience team' },
  { name: 'Graphic', description: 'Graphic design and branding team' },
  { name: 'Content', description: 'Content creation and strategy team' },
  { name: 'Bussiness', description: 'Business development and strategy team' }
];

const adminCredentials = {
  name: 'Admin User',
  email: 'admin@demo.com',
  password: '123456'
};

const leaderCredentials = [
  { team: 'Research', email: 'research@thimify.com', password: 'Research@123', name: 'Research Lead' },
  { team: 'Debuger', email: 'debuger@thimify.com', password: 'Debuger@123', name: 'Debuger Lead' },
  { team: 'Shopify', email: 'shopify@thimify.com', password: 'Shopify@123', name: 'Shopify Lead' },
  { team: 'Zed', email: 'zed@thimify.com', password: 'Zed@123', name: 'Zed Lead' },
  { team: 'Salla', email: 'salla@thimify.com', password: 'Salla@123', name: 'Salla Lead' },
  { team: 'Wordpress', email: 'wordpress@thimify.com', password: 'Wordpress@123', name: 'Wordpress Lead' },
  { team: 'Taster', email: 'taster@thimify.com', password: 'Taster@123', name: 'Taster Lead' },
  { team: 'UIUX', email: 'uiux@thimify.com', password: 'Uiux@123', name: 'UIUX Lead' },
  { team: 'Graphic', email: 'graphic@thimify.com', password: 'Graphic@123', name: 'Graphic Lead' },
  { team: 'Content', email: 'content@thimify.com', password: 'Content@123', name: 'Content Lead' },
  { team: 'Bussiness', email: 'business@thimify.com', password: 'Business@123', name: 'Bussiness Lead' }
];

const employeeBlueprints = [
  { id: 'e2', name: 'Ali Alaa', team: 'Debuger', level: 'Implementor' },
  { id: 'e3', name: 'Yahia', team: 'Debuger', level: 'Implementor' },
  { id: 'e4', name: 'Ziad', team: 'Debuger', level: 'Implementor' },
  { id: 'e5', name: 'Hannen Mohamed', team: 'Debuger', level: 'Implementor' },
  { id: 'e6', name: 'Kareem Shreef', team: 'Salla', level: 'Implementor' },
  { id: 'e7', name: 'Ahmed Wael', team: 'Salla', level: 'Implementor' },
  { id: 'e8', name: 'Yousf', team: 'Salla', level: 'Implementor' },
  { id: 'e9', name: 'Ziad Ali', team: 'Salla', level: 'Implementor' },
  { id: 'e10', name: 'Mansour', team: 'Zed', level: 'Maker' },
  { id: 'e11', name: 'Essam', team: 'Zed', level: 'Implementor' },
  { id: 'e12', name: 'Embaby', team: 'Zed', level: 'Implementor' },
  { id: 'e13', name: 'Mostafa', team: 'Shopify', level: 'Implementor' },
  { id: 'e14', name: 'Rady', team: 'Shopify', level: 'Implementor' },
  { id: 'e15', name: 'Karma', team: 'Shopify', level: 'Implementor' },
  { id: 'e16', name: 'Kholud', team: 'Taster', level: 'Implementor' },
  { id: 'e17', name: 'Galal', team: 'Taster', level: 'Implementor' },
  { id: 'e18', name: 'Yousf', team: 'Taster', level: 'Implementor' },
  { id: 'e19', name: 'Hannen', team: 'UIUX', level: 'Implementor' },
  { id: 'e20', name: 'Sandy', team: 'UIUX', level: 'Implementor' },
  { id: 'e21', name: 'Mariam', team: 'UIUX', level: 'Fresh' },
  { id: 'e22', name: 'Ahmed Ayman', team: 'UIUX', level: 'Implementor' },
  { id: 'e23', name: 'Kareem', team: 'UIUX', level: 'Implementor' },
  { id: 'e24', name: 'Hannony', team: 'Wordpress', level: 'Implementor' },
  { id: 'e25', name: 'Foud', team: 'Wordpress', level: 'Maker' },
  { id: 'e26', name: 'Osama', team: 'Wordpress', level: 'Implementor' },
  { id: 'e27', name: 'Manar', team: 'Bussiness', level: 'Implementor' },
  { id: 'e28', name: 'Shrouk', team: 'Graphic', level: 'Implementor' },
  { id: 'e29', name: 'Kareem', team: 'Content', level: 'Implementor' },
  { id: 'e30', name: 'Asmaa', team: 'Content', level: 'Implementor' }
];

const quizSeed = [
  {
    title: 'Performance Fundamentals',
    description: 'A short quiz for onboarding and team calibration.',
    questions: [
      { question: 'What does KPI stand for?', options: ['Key Performance Indicator', 'Known Project Item', 'Kernel Process Interface'], correctAnswer: 0, points: 2 },
      { question: 'Which metric best tracks delivery reliability?', options: ['On-time completion rate', 'Coffee count', 'Meeting duration'], correctAnswer: 0, points: 2 },
      { question: 'Which is the best feedback practice?', options: ['Be specific and actionable', 'Wait until year end', 'Only praise'], correctAnswer: 0, points: 1 }
    ],
    timeLimit: 20
  },
  {
    title: 'Team Collaboration Basics',
    description: 'Checks collaborative habits used across the SaaS dashboard.',
    questions: [
      { question: 'What should happen after a blocker is found?', options: ['Escalate early', 'Ignore it', 'Hide it'], correctAnswer: 0, points: 2 },
      { question: 'What keeps a team aligned?', options: ['Clear ownership', 'Random tasks', 'No documentation'], correctAnswer: 0, points: 2 }
    ],
    timeLimit: 15
  }
];

function buildCriteria(scores) {
  const names = ['Code Quality', 'Performance', 'Communication', 'Problem Solving', 'Teamwork', 'Punctuality'];
  return names.map((name, index) => ({
    name,
    score: scores[index],
    notes: `${name} evaluated at ${scores[index]}%`
  }));
}

function getPerformanceLevel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Average';
  if (score >= 60) return 'Needs Improvement';
  return 'Poor';
}

function toAccountName(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildEmployeeCredentials(employee) {
  const accountName = toAccountName(employee.name);
  const teamDomain = String(employee.team || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return {
    email: `${accountName}@${teamDomain}.com`,
    password: accountName
  };
}

async function seedDemoData() {
  let admin = await User.findOne({ email: adminCredentials.email });
  if (!admin) {
    admin = await User.create({
      name: adminCredentials.name,
      email: adminCredentials.email,
      password: adminCredentials.password,
      role: 'admin'
    });
  }

  const leaders = [];
  for (const entry of leaderCredentials) {
    let leader = await User.findOne({ email: entry.email });
    if (!leader) {
      leader = await User.create({
        name: entry.name,
        email: entry.email,
        password: entry.password,
        role: 'team_leader',
        team: entry.team
      });
    }
    leaders.push(leader);
  }

  const teamDocs = [];
  for (const team of teamDefinitions) {
    const leader = leaders.find(item => item.team === team.name);
    const teamDoc = await Team.findOneAndUpdate(
      { name: team.name },
      {
        name: team.name,
        description: team.description,
        leaderId: leader._id
      },
      { upsert: true, returnDocument: 'after' }
    );
    teamDocs.push(teamDoc);
  }

  const employees = [];
  for (const employee of employeeBlueprints) {
    const credentials = buildEmployeeCredentials(employee);
    const email = credentials.email;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.findOne({ name: employee.name, team: employee.team, role: 'employee' });
    }
    if (!user) {
      user = await User.create({
        name: employee.name,
        email,
        password: credentials.password,
        role: 'employee',
        team: employee.team,
        level: employee.level
      });
    } else {
      user.name = employee.name;
      user.email = email;
      user.password = credentials.password;
      user.role = 'employee';
      user.team = employee.team;
      user.level = employee.level;
      await user.save();
    }
    employees.push(user);
  }

  for (const quiz of quizSeed) {
    await Quiz.findOneAndUpdate(
      { title: quiz.title },
      {
        ...quiz,
        createdBy: admin._id
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June'];
  for (let index = 0; index < employees.length; index += 1) {
    const employee = employees[index];
    const month = monthNames[index % monthNames.length];
    const baseScore = 62 + (index * 3);
    const criteriaScores = [baseScore, baseScore + 4, baseScore + 2, baseScore + 6, baseScore + 5, baseScore + 1].map(score => Math.min(score, 98));
    const criteria = buildCriteria(criteriaScores);
    const totalScore = Math.round(criteria.reduce((sum, item) => sum + item.score, 0) / criteria.length);

    await Evaluation.findOneAndUpdate(
      {
        employeeId: employee._id,
        month,
        year: 2026
      },
      {
        employeeId: employee._id,
        evaluatedBy: leaders.find(leader => leader.team === employee.team)?._id || admin._id,
        month,
        year: 2026,
        criteria,
        notes: `Seeded evaluation for ${employee.name}`,
        totalScore,
        aiFeedback: `Seeded evaluation for ${employee.name}`,
        aiInsights: {
          trend: 'stable',
          consistency: 'consistent',
          strongAreas: 'Teamwork, Communication',
          weakAreas: 'None identified'
        },
        improvementPercentage: 0,
        performanceLevel: getPerformanceLevel(totalScore),
        suggestion: 'Continue steady growth and keep up the pace.'
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

}

module.exports = { seedDemoData };