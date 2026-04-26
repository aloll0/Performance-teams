const mongoose = require('mongoose');

const DEFAULT_EVALUATION_METRICS = [
  'Code Quality',
  'Performance',
  'Communication',
  'Problem Solving',
  'Teamwork',
  'Punctuality'
];

const evaluationMetricSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true });

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  evaluationMetrics: {
    type: [evaluationMetricSchema],
    default: () => DEFAULT_EVALUATION_METRICS.map((name) => ({ name, isActive: true }))
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on update
teamSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model('Team', teamSchema);
