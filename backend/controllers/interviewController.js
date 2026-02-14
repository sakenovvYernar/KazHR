const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { analyzeInterview } = require('../utils/aiAnalysis');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notifications');

// @desc    Create interview invitation
// @route   POST /api/interviews
// @access  Private/Employer
exports.createInterview = async (req, res) => {
  try {
    const { applicationId, scheduledDate, type, location } = req.body;

    const application = await Application.findById(applicationId).populate('jobId');

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

    const interview = await Interview.create({
      jobId: application.jobId._id,
      candidateId: application.candidateId,
      employerId: req.user.id,
      applicationId,
      scheduledDate,
      type,
      location: location || ''
    });

    // Update application status
    application.status = 'interview_invited';
    await application.save();

    // Notify candidate
    await createNotification(
      application.candidateId,
      NOTIFICATION_TYPES.INTERVIEW_INVITE,
      `You have been invited to interview for ${application.jobId.title}`,
      interview._id,
      'Interview'
    );

    res.status(201).json({
      success: true,
      data: interview
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit interview transcript and get AI analysis
// @route   POST /api/interviews/:id/analyze
// @access  Private
exports.analyzeInterviewTranscript = async (req, res) => {
  try {
    const { transcript } = req.body;

    const interview = await Interview.findById(req.params.id).populate('jobId');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check authorization
    if (interview.candidateId.toString() !== req.user.id && 
        interview.employerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Save transcript
    interview.transcript = transcript;
    interview.status = 'in_progress';

    // Analyze with Gemini AI
    const analysisResult = await analyzeInterview(
      transcript,
      interview.jobId.description,
      interview.jobId.requiredSkills
    );

    if (analysisResult.success) {
      interview.aiScore = analysisResult.analysis.score;
      interview.aiDecision = analysisResult.analysis.decision;
      interview.aiAnalysis = {
        strengths: analysisResult.analysis.strengths,
        weaknesses: analysisResult.analysis.weaknesses,
        recommendation: analysisResult.analysis.recommendation
      };
      interview.status = 'completed';
      interview.completedAt = new Date();
    }

    await interview.save();

    // Notify employer
    await createNotification(
      interview.employerId,
      NOTIFICATION_TYPES.INTERVIEW_COMPLETE,
      `Interview analysis completed for ${interview.jobId.title}`,
      interview._id,
      'Interview'
    );

    res.status(200).json({
      success: true,
      data: interview
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get my interviews
// @route   GET /api/interviews/mine
// @access  Private
exports.getMyInterviews = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'jobseeker') {
      query.candidateId = req.user.id;
    } else if (req.user.role === 'employer') {
      query.employerId = req.user.id;
    }

    const interviews = await Interview.find(query)
      .populate('jobId')
      .populate('candidateId', 'name email skills')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single interview
// @route   GET /api/interviews/:id
// @access  Private
exports.getInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('jobId')
      .populate('candidateId', 'name email skills experience');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check authorization
    if (interview.candidateId._id.toString() !== req.user.id && 
        interview.employerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: interview
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
