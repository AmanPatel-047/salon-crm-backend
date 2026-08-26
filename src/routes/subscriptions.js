const express = require('express');
const router = express.Router();
const { assignPlan, renewPlan, upgradePlan, getHistory, getMySubscriptionStatus } = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

// Super Admin routes
router.post('/assign', authenticate, authorize(ROLES.SUPER_ADMIN), assignPlan);
router.post('/renew', authenticate, authorize(ROLES.SUPER_ADMIN), renewPlan);
router.post('/upgrade', authenticate, authorize(ROLES.SUPER_ADMIN), upgradePlan);
router.get('/history/:salonId', authenticate, authorize(ROLES.SUPER_ADMIN), getHistory);

// Salon Owner route — view own subscription status
router.get('/status', authenticate, authorize(ROLES.SALON_OWNER), getMySubscriptionStatus);

module.exports = router;
