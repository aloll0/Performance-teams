const mongoose = require('mongoose');

const criterionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  notes: {
    type: String,
    default: ''
  }
});

const evaluationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  criteria: [criterionSchema],
  totalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  improvementPercentage: {
    type: Number,
    default: 0
  },
  performanceLevel: {
    type: String,
    enum: ['Excellent', 'Good', 'Average', 'Needs Improvement', 'Poor'],
    default: 'Average'
  },
  suggestion: {
    type: String,
    default: ''
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

// Compound index to ensure one evaluation per employee per month
evaluationSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

// Update timestamp on update
evaluationSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
