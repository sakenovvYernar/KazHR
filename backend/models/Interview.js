const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  transcript: {
    type: String,
    default: ''
  },
  aiScore: {
    type: Number,
    min: 0,
    max: 100
  },
  aiDecision: {
    type: String,
    enum: ['Yes', 'No', 'Maybe', 'Pending'],
    default: 'Pending'
  },
  aiAnalysis: {
    strengths: [String],
    weaknesses: [String],
    recommendation: String
  },
  scheduledDate: {
    type: Date
  },
  type: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online'
  },
  location: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Interview', interviewSchema);
