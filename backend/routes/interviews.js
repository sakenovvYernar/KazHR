const express = require('express');
const router = express.Router();
const {
  createInterview,
  analyzeInterviewTranscript,
  getMyInterviews,
  getInterview
} = require('../controllers/interviewController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('employer'), createInterview);
router.post('/:id/analyze', protect, analyzeInterviewTranscript);
router.get('/mine', protect, getMyInterviews);
router.get('/:id', protect, getInterview);

module.exports = router;
