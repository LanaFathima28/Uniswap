import express from 'express';
import User from '../models/User.js';
import verifyFirebaseToken from '../middleware/verifyFirebaseToken.js';

const router = express.Router();

// Helper for email domain validation
const getCollegePattern = () => (process.env.COLLEGE_EMAIL_DOMAIN || 'collegename').replace(/^@/, '');

const validateCollegeEmail = (email) => {
  const collegePattern = getCollegePattern();
  if (!email || typeof email !== 'string') return false;
  return email.toLowerCase().includes(collegePattern.toLowerCase());
};

/**
 * @route   POST /api/auth/register
 * @desc    Create a MongoDB user profile after Firebase Signup
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const {
      firebaseUID,
      name,
      email,
      role,
      branch,
      year,
      company,
      designation,
      profilePhotoUrl
    } = req.body;

    const collegePattern = getCollegePattern();

    // 1. Check required base fields
    if (!firebaseUID || !name || !email || !role) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Missing required fields: firebaseUID, name, email, and role are mandatory.'
      });
    }

    // 2. Validate email domain requirement
    if (!validateCollegeEmail(email)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Email restriction failed: email must contain "${collegePattern}" (e.g. user.${collegePattern}@gmail.com or user@${collegePattern}.edu).`
      });
    }

    // 3. Role-specific validation
    if (role === 'Student') {
      if (!branch || !branch.trim()) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Branch is required for Students.'
        });
      }
      if (!year || !year.trim()) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Year is required for Students.'
        });
      }
    } else if (role === 'Alumni') {
      if (!company || !company.trim()) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Company is required for Alumni.'
        });
      }
      if (!designation || !designation.trim()) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Designation is required for Alumni.'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid role. Must be either "Student" or "Alumni".'
      });
    }

    // 4. Check for existing user in MongoDB
    const existingUser = await User.findOne({
      $or: [{ firebaseUID }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        data: null,
        message: 'User profile with this Firebase UID or email already exists.'
      });
    }

    // 5. Create user document
    const newUser = new User({
      firebaseUID,
      name,
      email: email.toLowerCase(),
      role,
      branch: role === 'Student' ? branch : undefined,
      year: role === 'Student' ? year : undefined,
      company: role === 'Alumni' ? company : undefined,
      designation: role === 'Alumni' ? designation : undefined,
      profilePhotoUrl: profilePhotoUrl || ''
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      data: newUser,
      message: 'User registered and profile created successfully.'
    });
  } catch (error) {
    console.error('Error in /api/auth/register:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: `Server Error: ${error.message}`
    });
  }
});

/**
 * @route   POST /api/auth/login-sync
 * @desc    Fetch matching MongoDB user profile after Firebase Login
 * @access  Public
 */
router.post('/login-sync', async (req, res) => {
  try {
    const { firebaseUID } = req.body;

    if (!firebaseUID) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'firebaseUID is required.'
      });
    }

    const user = await User.findOne({ firebaseUID });

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found in database for this Firebase UID.'
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
      message: 'User profile fetched successfully.'
    });
  } catch (error) {
    console.error('Error in /api/auth/login-sync:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: `Server Error: ${error.message}`
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Protected route returning logged-in user profile
 * @access  Private (Requires valid Firebase ID Token)
 */
router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    const firebaseUID = req.user.firebaseUID;

    const user = await User.findOne({ firebaseUID });

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found in MongoDB.'
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
      message: 'Logged-in user profile retrieved successfully.'
    });
  } catch (error) {
    console.error('Error in GET /api/auth/me:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: `Server Error: ${error.message}`
    });
  }
});

export default router;
