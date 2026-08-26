const { error } = require('../utils/apiResponse');

/**
 * RBAC authorization middleware.
 * Checks if the authenticated user's role is in the allowed list.
 * This is server-side enforcement — hiding UI buttons is NOT sufficient.
 *
 * @param  {...string} allowedRoles - Roles that can access this route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required.', 401, 'UNAUTHORIZED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(
        res,
        'You do not have permission to perform this action.',
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
};

module.exports = { authorize };
