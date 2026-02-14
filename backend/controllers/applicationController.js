const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { calculateMatchScore } = require('../utils/matching');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notifications');

// @desc    Apply for job
// @route   POST /api/applications
// @access  Private/JobSeeker
exports.applyForJob = async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId,
      candidateId: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Get candidate details
    const candidate = await User.findById(req.user.id);

    // Calculate match score
    const matchScore = calculateMatchScore(job.requiredSkills, candidate.skills);

    // Create application
    const application = await Application.create({
      jobId,
      candidateId: req.user.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      candidateSkills: candidate.skills,
      matchScore,
      coverLetter
    });

    // Update job applications count
    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicationsCount: 1 }
    });

    // Create notification for employer
    await createNotification(
      job.employerId,
      NOTIFICATION_TYPES.NEW_APPLICATION,
      `New application from ${candidate.name} for ${job.title}`,
      application._id,
      'Application'
    );

    res.status(201).json({
      success: true,
      data: application
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get my applications (Job Seeker)
// @route   GET /api/applications/mine
// @access  Private/JobSeeker
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidateId: req.user.id })
      .populate('jobId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get applications for a job (Employer)
// @route   GET /api/applications/job/:jobId
// @access  Private/Employer
exports.getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check ownership
    if (job.employerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('candidateId')
      .sort({ matchScore: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private/Employer
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const application = await Application.findById(req.params.id).populate('jobId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check ownership
    if (application.jobId.employerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    application.status = status;
    await application.save();

    // Create notification for candidate
    await createNotification(
      application.candidateId,
      NOTIFICATION_TYPES.STATUS_UPDATE,
      `Your application status for ${application.jobId.title} has been updated to: ${status}`,
      application._id,
      'Application'
    );

    res.status(200).json({
      success: true,
      data: application
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
