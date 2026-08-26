const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required.', 400, 'MISSING_FIELDS');
    }

    // Find user with password field included
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return error(res, 'Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      return error(res, 'Account has been deactivated.', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return error(res, 'Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role, salonId: user.salonId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return success(res, {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        salonId: user.salonId,
      },
    }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Login failed.', 500);
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user's profile.
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('salonId', 'name');
    return success(res, user, 'Profile retrieved');
  } catch (err) {
    console.error('GetMe error:', err);
    return error(res, 'Failed to retrieve profile.', 500);
  }
};


/**
 * PUT /api/auth/me
 * Update current authenticated user's profile.
 */
const updateMe = async (req, res) => {
  try {
    const { name, avatarUrl } = req.body;
    
    // Only allow updating safe fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('salonId', 'name');
    
    return success(res, user, 'Profile updated successfully');
  } catch (err) {
    console.error('Update profile error:', err);
    return error(res, 'Failed to update profile.', 500);
  }
};

module.exports = { login, getMe, updateMe };
