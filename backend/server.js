const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const quizRoutes = require('./routes/quizRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const workLogRoutes = require('./routes/workLogRoutes');
const { seedDemoData } = require('./utils/seedDemoData');
const User = require('./models/User');
const Team = require('./models/Team');
const { normalizeTeamName } = require('./utils/normalizeTeamName');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
const shouldSeedInDevelopment = process.env.ENABLE_DEMO_SEED === 'true' && !isProduction;
const shouldSeedInProduction = process.env.AUTO_SEED_ON_START === 'true' && isProduction;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function validateProductionConfig() {
  if (!isProduction) return;

  const mongoUri = getRequiredEnv('MONGODB_URI');
  const jwtSecret = getRequiredEnv('JWT_SECRET');

  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }

  if (mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')) {
    throw new Error('MONGODB_URI must point to secured hosted MongoDB in production');
  }
}

validateProductionConfig();

async function seedIfDatabaseIsEmpty() {
  const employeeCount = await User.countDocuments({ role: 'employee', isActive: true });
  if (employeeCount > 0) {
    return false;
  }

  await seedDemoData();
  return true;
}

app.disable('x-powered-by');
app.use(helmet());

const frontendUrl = process.env.FRONTEND_URL;
app.use(cors({
  origin: isProduction
    ? (frontendUrl ? [frontendUrl] : false)
    : true,
  credentials: true,
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 50 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

app.use('/api/auth', authLimiter);
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/work-logs', workLogRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error('Unhandled server error:', error);
  res.status(500).json({ message: 'Server error' });
});

async function startServer() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/employee-performance';
    await mongoose.connect(mongoUri);

    const zidTeamExists = await Team.findOne({ name: 'Zid' });
    const legacyTeams = await Team.find({ name: 'Zed' });
    for (const team of legacyTeams) {
      if (zidTeamExists) {
        await team.deleteOne();
      } else {
        team.name = 'Zid';
        team.updatedAt = new Date();
        await team.save();
      }
    }

    const legacyUsers = await User.find({ $or: [{ team: 'Zed' }, { email: /@zed\./i }] });
    for (const user of legacyUsers) {
      user.team = 'Zid';
      if (user.email && user.email.includes('@zed.')) {
        user.email = user.email.replace(/@zed\./gi, `@${normalizeTeamName('Zed').toLowerCase()}.`);
      }
      user.updatedAt = new Date();
      await user.save();
    }

    if (shouldSeedInDevelopment || shouldSeedInProduction) {
      const didSeed = await seedIfDatabaseIsEmpty();
      if (didSeed) {
        console.log('Demo seed data applied');
      } else {
        console.log('Seed skipped because database already has active employees');
      }
    }

    app.listen(port, () => {
      console.log(`API server listening on 0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}

startServer();
