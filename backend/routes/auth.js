const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Get all candidates (jobseekers) from database
router.get('/candidates', async (req, res) => {
  try {
    console.log('📋 GET /api/auth/candidates - Fetching candidates from database');
    
    // Find all users with role 'jobseeker'
    const candidates = await User.find({ role: 'jobseeker' })
      .select('-password') // Exclude password from results
      .sort({ createdAt: -1 }); // Sort by newest first
    
    console.log(`✅ Found ${candidates.length} candidates in database`);
    
    res.status(200).json({
      success: true,
      data: candidates,
      count: candidates.length
    });
  } catch (error) {
    console.error('❌ Error fetching candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching candidates',
      error: error.message
    });
  }
});

// Get candidate by ID
router.get('/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 GET /api/auth/candidates/${id} - Fetching candidate details`);
    
    const candidate = await User.findOne({ _id: id, role: 'jobseeker' })
      .select('-password');
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    console.log(`✅ Found candidate: ${candidate.name}`);
    
    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    console.error('❌ Error fetching candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching candidate',
      error: error.message
    });
  }
});

module.exports = router;
