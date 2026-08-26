const Salon = require('../models/Salon');
const { ROLES, SUBSCRIPTION_STATUS } = require('../config/constants');
const { error } = require('../utils/apiResponse');

/**
 * Subscription gating middleware.
 * Checks if the salon's subscription is active before allowing access.
 * Super admins bypass this check.
 * Returns exact error format specified in the assessment.
 */
const checkSubscription = async (req, res, next) => {
  try {
    // Super admins are not tied to a salon subscription
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (!req.salonId) {
      return error(res, 'No salon associated with this account.', 403, 'NO_SALON');
    }

    const salon = await Salon.findById(req.salonId);
    if (!salon) {
      return error(res, 'Salon not found.', 404, 'SALON_NOT_FOUND');
    }

    // Check if subscription has expired
    if (
      salon.subscriptionStatus === SUBSCRIPTION_STATUS.EXPIRED ||
      salon.subscriptionStatus === SUBSCRIPTION_STATUS.NONE ||
      !salon.subscriptionEndDate ||
      new Date() > new Date(salon.subscriptionEndDate)
    ) {
      // Auto-update status if it was active but date has passed
      if (salon.subscriptionStatus === SUBSCRIPTION_STATUS.ACTIVE && new Date() > new Date(salon.subscriptionEndDate)) {
        salon.subscriptionStatus = SUBSCRIPTION_STATUS.EXPIRED;
        await salon.save();
      }

      return res.status(403).json({
        error: 'SUBSCRIPTION_EXPIRED',
        message: 'Your subscription has expired. Please contact the administrator to renew your plan.',
      });
    }

    // Attach salon to request for downstream use
    req.salon = salon;
    next();
  } catch (err) {
    console.error('Subscription middleware error:', err);
    return error(res, 'Error checking subscription status.', 500);
  }
};

module.exports = { checkSubscription };
