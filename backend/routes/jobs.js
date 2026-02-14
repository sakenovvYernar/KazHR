const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  getMyJobs
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getJobs)
  .post(protect, authorize('employer'), createJob);

router.get('/employer/mine', protect, authorize('employer'), getMyJobs);

router.route('/:id')
  .get(getJob)
  .put(protect, authorize('employer'), updateJob)
  .delete(protect, authorize('employer'), deleteJob);

module.exports = router;
