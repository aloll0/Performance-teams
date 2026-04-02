const mongoose = require('mongoose');

const workItemSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: true,
      trim: true
    },
    hours: {
      type: Number,
      required: true,
      min: 0.25,
      max: 7
    },
    notes: {
      type: String,
      default: '',
      trim: true
    }
  },
  { _id: false }
);

const workLogSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  team: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true
  },
  items: {
    type: [workItemSchema],
    default: []
  },
  totalHours: {
    type: Number,
    required: true,
    min: 0.25,
    max: 7
  },
  status: {
    type: String,
    enum: ['submitted', 'reviewed'],
    default: 'submitted'
  },
  leaderComment: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

workLogSchema.index({ employeeId: 1, date: 1 }, { unique: true });

workLogSchema.pre('save', function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('WorkLog', workLogSchema);
