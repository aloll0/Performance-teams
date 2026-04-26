const mongoose = require('mongoose');

const completionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const courseVideoSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    default: ''
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const learningCourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    default: '',
    trim: true
  },
  platform: {
    type: String,
    trim: true,
    default: ''
  },
  focusArea: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  team: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completions: {
    type: [completionSchema],
    default: []
  },
  videos: {
    type: [courseVideoSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
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

learningCourseSchema.index({ team: 1, createdAt: -1 });
learningCourseSchema.index({ createdBy: 1, createdAt: -1 });

learningCourseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

learningCourseSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model('LearningCourse', learningCourseSchema);
