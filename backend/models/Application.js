const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
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
  candidateName: {
    type: String,
    required: true
  },
  candidateEmail: {
    type: String,
    required: true
  },
  candidateSkills: [{
    type: String
  }],
  matchScore: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['applied', 'interview_invited', 'rejected', 'hired'],
    default: 'applied'
  },
  coverLetter: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Prevent duplicate applications
applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
