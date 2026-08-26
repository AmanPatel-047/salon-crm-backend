const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { error } = require('../utils/apiResponse');

/**
 * Authentication middleware — verifies JWT and attaches user to req.
 * Extracts salonId from the authenticated user's record (tenant isolation).
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Authentication required. Please provide a valid token.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return error(res, 'Token has expired. Please login again.', 401, 'TOKEN_EXPIRED');
      }
      return error(res, 'Invalid token. Please login again.', 401, 'INVALID_TOKEN');
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return error(res, 'User not found.', 401, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      return error(res, 'Account has been deactivated.', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Attach user and salonId to request — this is the ONLY source of salonId
    req.user = user;
    req.salonId = user.salonId; // null for super_admin

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return error(res, 'Authentication failed.', 500);
  }
};

module.exports = { authenticate };
